using System;
using System.IO;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace Prisma_Launcher
{
    public class FileDownloader
    {
        private readonly HttpClient _httpClient;
        private const int BufferSize = 8192; // 8KB buffer

        public FileDownloader(int timeoutSeconds = 300)
        {
            _httpClient = new HttpClient
            {
                Timeout = TimeSpan.FromSeconds(timeoutSeconds)
            };
        }

        public async Task DownloadFileAsync(
            string url,
            string destinationPath,
            IProgress<DownloadProgress> progress = null,
            CancellationToken cancellationToken = default)
        {
            try
            {
                // Crear directorio si no existe
                var directory = Path.GetDirectoryName(destinationPath);
                if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
                {
                    Directory.CreateDirectory(directory);
                }

                using (var response = await _httpClient.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, cancellationToken))
                {
                    response.EnsureSuccessStatusCode();

                    var totalBytes = response.Content.Headers.ContentLength ?? -1;
                    var canReportProgress = totalBytes != -1 && progress != null;

                    using (var contentStream = await response.Content.ReadAsStreamAsync())
                    using (var fileStream = new FileStream(destinationPath, FileMode.Create, FileAccess.Write, FileShare.None, BufferSize, true))
                    {
                        var totalBytesRead = 0L;
                        var buffer = new byte[BufferSize];
                        var isMoreToRead = true;

                        do
                        {
                            cancellationToken.ThrowIfCancellationRequested();

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
                                    ProgressPercentage = progressPercentage
                                });
                            }
                        }
                        while (isMoreToRead);
                    }
                }
            }
            catch (TaskCanceledException)
            {
                Console.WriteLine("Descarga cancelada.");
                throw;
            }
            catch (HttpRequestException ex)
            {
                Console.WriteLine($"Error de red: {ex.Message}");
                throw;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error inesperado: {ex.Message}");
                throw;
            }
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

        public string GetFormattedProgress()
        {
            return $"{FormatBytes(BytesDownloaded)} / {FormatBytes(TotalBytes)} ({ProgressPercentage:F2}%)";
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
}