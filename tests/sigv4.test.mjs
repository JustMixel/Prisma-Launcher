// Regresión de la firma AWS Signature V4 del cliente S3.
// Vectores de referencia tomados de aws4/test/fast.js (mhart/aws4).
// Ejecutar con: npm test

import { signRequest } from "../src/utils/fileserver/s3.js";
import { checkUploadSize } from "../src/utils/fileserver/storageManager.js";

const CREDENTIALS = {
    accessKeyId: "ABCDEF",
    secretAccessKey: "abcdef1234567890",
    region: "us-east-1",
    timestamp: "20121226T061030Z"
};

const DATE = "Wed, 26 Dec 2012 06:10:30 GMT";

const VECTORS = [
    {
        name: "GET sin cuerpo (hash vacío)",
        options: {
            ...CREDENTIALS,
            method: "GET",
            endpoint: "http://localhost:9000",
            bucket: "",
            headers: { Date: DATE }
        },
        expected: "6fda8a58c01edfcb6773c15ad5a276a893ce52978a8f5cd1705fae14df78cfd4"
    },
    {
        name: "PUT con cuerpo y X-Amz-Content-Sha256 propio",
        options: {
            ...CREDENTIALS,
            method: "PUT",
            endpoint: "https://s3.amazonaws.com",
            bucket: "some-bucket",
            key: "file.txt",
            body: "Test Body",
            headers: {
                Date: DATE,
                "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
                "Content-Length": "9",
                "X-Amz-Content-Sha256": "My-Generated-Body-Hash"
            }
        },
        expected: "afa4074a64185317be81ed18953c6df9ee3a63507e6711ad79a7534f4c0b0c54"
    }
];

let failed = false;

for (const vector of VECTORS) {
    const signed = await signRequest(vector.options);
    const signature = /Signature=([a-f0-9]{64})/.exec(signed.headers.Authorization)?.[1];
    const ok = signature === vector.expected;

    console.log(`${ok ? "✅" : "❌"} ${vector.name}`);
    if (!ok) {
        console.log(`   esperado: ${vector.expected}`);
        console.log(`   obtenido: ${signature}`);
        failed = true;
    }
}

// Regla de tamaño del File Server: 5 GB por archivo y 5 GB por bucket.
const GB = 1024 ** 3;
const SIZE_CASES = [
    { name: "archivo de exactamente 5 GB con bucket vacío", fileBytes: 5 * GB, usedBytes: 0, expected: true },
    { name: "archivo de 5 GB + 1 byte se rechaza siempre", fileBytes: 5 * GB + 1, usedBytes: 0, expectedReason: "file" },
    { name: "archivo de 5 GB con 1 byte usado se rechaza", fileBytes: 5 * GB, usedBytes: 1, expectedReason: "bucket" },
    { name: "4 GB + 1 GB usado = 5 GB exactos", fileBytes: 4 * GB, usedBytes: 1 * GB, expected: true },
    { name: "4 GB + 1 GB + 1 byte usado se rechaza", fileBytes: 4 * GB, usedBytes: 1 * GB + 1, expectedReason: "bucket" },
    { name: "archivo vacío se rechaza", fileBytes: 0, usedBytes: 0, expectedReason: "empty" }
];

for (const testCase of SIZE_CASES) {
    const result = checkUploadSize(testCase.fileBytes, testCase.usedBytes);
    const ok = testCase.expected ? result.ok === true : result.reason === testCase.expectedReason;
    console.log(`${ok ? "✅" : "❌"} ${testCase.name}`);
    if (!ok) {
        console.log(`   obtenido: ${JSON.stringify(result)}`);
        failed = true;
    }
}

if (failed) {
    process.exitCode = 1;
}
