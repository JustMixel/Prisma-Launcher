using System;
using System.IO;
using System.IO.Compression;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using SharpCompress.Archives;
using SharpCompress.Common;
using System.Linq;

namespace Prisma_Launcher
{
    public class FileDownloader
    {
        private readonly HttpClient _httpClient;
        private const int BufferSize = 8192;
        private bool _isPaused;
        private readonly object _pauseLock = new object();

        public FileDownloader(int timeoutSeconds = 300)
        {
            _httpClient = new HttpClient
            {
                Timeout = TimeSpan.FromSeconds(timeoutSeconds)
            };
        }

        public bool IsPaused
        {
            get
            {
                lock (_pauseLock)
                {
                    return _isPaused;
                }
            }
        }

        public void Pause()
        {
            lock (_pauseLock)
            {
                _isPaused = true;
            }
        }

        public void Resume()
        {
            lock (_pauseLock)
            {
                _isPaused = false;
                Monitor.PulseAll(_pauseLock);
            }
        }

        /// <summary>
        /// Descarga un archivo y opcionalmente lo extrae automáticamente
        /// Soporta pausa/reanudación y cancelación
        /// </summary>
        public async Task DownloadFileAsync(
            string url,
            string destinationPath,
            IProgress<DownloadProgress> progress = null,
            CancellationToken cancellationToken = default,
            bool autoExtract = false,
            string extractToFolder = null,
            IProgress<ExtractionProgress> extractProgress = null,
            bool deleteAfterExtraction = false)
        {
            try
            {
                // PASO 1: Descargar archivo con soporte de pausa
                await DownloadWithResumeAsync(url, destinationPath, progress, cancellationToken);

                // PASO 2: Extraer automáticamente si está habilitado
                if (autoExtract)
                {
                    if (string.IsNullOrEmpty(extractToFolder))
                    {
                        extractToFolder = Path.GetDirectoryName(destinationPath);
                    }

                    await ExtractFileAsync(destinationPath, extractToFolder, extractProgress, cancellationToken);

                    if (deleteAfterExtraction && File.Exists(destinationPath))
                    {
                        File.Delete(destinationPath);
                    }
                }
            }
            catch (TaskCanceledException)
            {
                Console.WriteLine("Operación cancelada.");
                throw;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
                throw;
            }
        }

        private async Task DownloadWithResumeAsync(
            string url,
            string destinationPath,
            IProgress<DownloadProgress> progress,
            CancellationToken cancellationToken)
        {
            var directory = Path.GetDirectoryName(destinationPath);
            if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }

            var tempPath = destinationPath + ".tmp";
            long startByte = 0;

            // Si existe archivo temporal, reanudar desde ahí
            if (File.Exists(tempPath))
            {
                startByte = new FileInfo(tempPath).Length;
            }

            var request = new HttpRequestMessage(HttpMethod.Get, url);

            // Solicitar rango de bytes (resume capability)
            if (startByte > 0)
            {
                request.Headers.Range = new System.Net.Http.Headers.RangeHeaderValue(startByte, null);
            }

            using (var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken))
            {
                response.EnsureSuccessStatusCode();

                var totalBytes = response.Content.Headers.ContentLength ?? -1;
                if (totalBytes != -1)
                {
                    totalBytes += startByte; // Tamaño total incluyendo lo ya descargado
                }

                var canReportProgress = totalBytes != -1 && progress != null;

                using (var contentStream = await response.Content.ReadAsStreamAsync())
                using (var fileStream = new FileStream(tempPath, FileMode.Append, FileAccess.Write, FileShare.None, BufferSize, true))
                {
                    var totalBytesRead = startByte;
                    var buffer = new byte[BufferSize];
                    var isMoreToRead = true;

                    do
                    {
                        // Verificar cancelación
                        cancellationToken.ThrowIfCancellationRequested();

                        // Verificar pausa
                        lock (_pauseLock)
                        {
                            while (_isPaused && !cancellationToken.IsCancellationRequested)
                            {
                                Monitor.Wait(_pauseLock);
                            }
                        }

                        var bytesRead = await contentStream.ReadAsync(buffer, 0, buffer.Length, cancellationToken);

                        if (bytesRead == 0)
                        {
                            isMoreToRead = false;
                            continue;
                        }

                        await fileStream.WriteAsync(buffer, 0, bytesRead, cancellationToken);

                        totalBytesRead += bytesRead;

                        if (canReportProgress)
                        {
                            var progressPercentage = (double)totalBytesRead / totalBytes * 100;
                            progress.Report(new DownloadProgress
                            {
                                TotalBytes = totalBytes,
                                BytesDownloaded = totalBytesRead,
                                ProgressPercentage = progressPercentage,
                                IsPaused = _isPaused
                            });
                        }
                    }
                    while (isMoreToRead);
                }
            }

            // Renombrar archivo temporal al nombre final
            if (File.Exists(destinationPath))
            {
                File.Delete(destinationPath);
            }
            File.Move(tempPath, destinationPath);
        }

        /// <summary>
        /// Extrae archivos .zip, .rar o .7z con soporte de pausa/cancelación
        /// </summary>
        private async Task ExtractFileAsync(
            string compressedFilePath,
            string extractToFolder,
            IProgress<ExtractionProgress> progress,
            CancellationToken cancellationToken)
        {
            if (!File.Exists(compressedFilePath))
            {
                throw new FileNotFoundException("Archivo comprimido no encontrado", compressedFilePath);
            }

            if (!Directory.Exists(extractToFolder))
            {
                Directory.CreateDirectory(extractToFolder);
            }

            var extension = Path.GetExtension(compressedFilePath).ToLowerInvariant();

            switch (extension)
            {
                case ".zip":
                    await ExtractZipAsync(compressedFilePath, extractToFolder, progress, cancellationToken);
                    break;

                case ".rar":
                case ".7z":
                    await ExtractWithSharpCompressAsync(compressedFilePath, extractToFolder, progress, cancellationToken);
                    break;

                default:
                    throw new NotSupportedException($"Formato no soportado: {extension}");
            }
        }

        private async Task ExtractZipAsync(
            string zipPath,
            string extractPath,
            IProgress<ExtractionProgress> progress,
            CancellationToken cancellationToken)
        {
            await Task.Run(() =>
            {
                using (var archive = ZipFile.OpenRead(zipPath))
                {
                    var totalEntries = archive.Entries.Count;
                    var extractedCount = 0;

                    foreach (var entry in archive.Entries)
                    {
                        // Verificar cancelación
                        cancellationToken.ThrowIfCancellationRequested();

                        // Verificar pausa
                        lock (_pauseLock)
                        {
                            while (_isPaused && !cancellationToken.IsCancellationRequested)
                            {
                                Monitor.Wait(_pauseLock);
                            }
                        }

                        if (string.IsNullOrEmpty(entry.Name))
                        {
                            var folderPath = Path.Combine(extractPath, entry.FullName);
                            Directory.CreateDirectory(folderPath);
                        }
                        else
                        {
                            var destinationPath = Path.Combine(extractPath, entry.FullName);
                            var destinationDir = Path.GetDirectoryName(destinationPath);

                            if (!Directory.Exists(destinationDir))
                            {
                                Directory.CreateDirectory(destinationDir);
                            }

                            entry.ExtractToFile(destinationPath, overwrite: true);
                        }

                        extractedCount++;

                        progress?.Report(new ExtractionProgress
                        {
                            TotalFiles = totalEntries,
                            ExtractedFiles = extractedCount,
                            CurrentFile = entry.FullName,
                            ProgressPercentage = (double)extractedCount / totalEntries * 100,
                            IsPaused = _isPaused
                        });
                    }
                }
            }, cancellationToken);
        }

        private async Task ExtractWithSharpCompressAsync(
            string compressedPath,
            string extractPath,
            IProgress<ExtractionProgress> progress,
            CancellationToken cancellationToken)
        {
            await Task.Run(() =>
            {
                // Requiere: Install-Package SharpCompress
                // using SharpCompress.Archives; using SharpCompress.Common; using System.Linq;

                using (var archive = ArchiveFactory.Open(compressedPath))
                {
                    var totalEntries = archive.Entries.Count();
                    var extractedCount = 0;

                    foreach (var entry in archive.Entries.Where(e => !e.IsDirectory))
                    {
                        cancellationToken.ThrowIfCancellationRequested();

                        lock (_pauseLock)
                        {
                            while (_isPaused && !cancellationToken.IsCancellationRequested)
                            {
                                Monitor.Wait(_pauseLock);
                            }
                        }

                        entry.WriteToDirectory(extractPath, new ExtractionOptions
                        {
                            ExtractFullPath = true,
                            Overwrite = true
                        });

                        extractedCount++;

                        progress?.Report(new ExtractionProgress
                        {
                            TotalFiles = totalEntries,
                            ExtractedFiles = extractedCount,
                            CurrentFile = entry.Key,
                            ProgressPercentage = (double)extractedCount / totalEntries * 100,
                            IsPaused = _isPaused
                        });
                    }
                }              
            }, cancellationToken);
        }

        public void Dispose()
        {
            _httpClient?.Dispose();
        }
    }

    public class DownloadProgress
    {
        public long TotalBytes { get; set; }
        public long BytesDownloaded { get; set; }
        public double ProgressPercentage { get; set; }
        public bool IsPaused { get; set; }

        public string GetFormattedProgress()
        {
            var pauseText = IsPaused ? " [PAUSADO]" : "";
            return $"{ProgressPercentage:F1}%{pauseText}";
        }

        private static string FormatBytes(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB", "TB" };
            double len = bytes;
            int order = 0;
            while (len >= 1024 && order < sizes.Length - 1)
            {
                order++;
                len = len / 1024;
            }
            return $"{len:0.##} {sizes[order]}";
        }
    }

    public class ExtractionProgress
    {
        public int TotalFiles { get; set; }
        public int ExtractedFiles { get; set; }
        public string CurrentFile { get; set; }
        public double ProgressPercentage { get; set; }
        public bool IsPaused { get; set; }

        public string GetFormattedProgress()
        {
            var pauseText = IsPaused ? " [PAUSADO]" : "";
            return $"{ExtractedFiles}/{TotalFiles} archivos ({ProgressPercentage:F1}%){pauseText}";
        }
    }
}