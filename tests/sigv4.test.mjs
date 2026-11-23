// Regresión de la firma AWS Signature V4 del cliente S3.
// Vectores de referencia tomados de aws4/test/fast.js (mhart/aws4).
// Ejecutar con: npm test

import { signRequest } from "../src/utils/fileserver/s3.js";

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

if (failed) {
    process.exitCode = 1;
}
