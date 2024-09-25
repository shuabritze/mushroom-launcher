import { parentPort, workerData } from "worker_threads";
import LZMA from "lzma";
import AdmZip from "adm-zip";
import ByteBuffer from "bytebuffer";

const VZIP_HEADER = 0x5a56;
const VZIP_FOOTER = 0x767a;
// https://github.com/DoctorMcKay/node-steam-user
function decompressVZip(fileBuffer: Buffer) {
    return new Promise((resolve, reject) => {
        // VZip or standard zip?
        if (fileBuffer.readUInt16LE(0) !== VZIP_HEADER) {
            // Standard zip
            const unzip = new AdmZip(fileBuffer);
            return unzip.readFile(unzip.getEntries()[0]);
        }

        // VZip
        const fileByteBuffer = ByteBuffer.wrap(
            fileBuffer,
            ByteBuffer.LITTLE_ENDIAN,
        );
        fileByteBuffer.skip(2); // skip header

        if (fileByteBuffer.readByte() !== "a".charCodeAt(0)) {
            throw new Error("Expected VZip version 'a'");
        }

        fileByteBuffer.skip(4); // skip timestamp or CRC
        const properties = fileByteBuffer
            .slice(fileByteBuffer.offset, fileByteBuffer.offset + 5)
            .toBuffer();
        fileByteBuffer.skip(5);

        const compressedData = fileByteBuffer
            .slice(fileByteBuffer.offset, fileByteBuffer.limit - 10)
            .toBuffer(); // Convert to Buffer only once

        fileByteBuffer.skip(compressedData.length); // skip compressed data

        const decompressedCrc = fileByteBuffer.readUint32();
        const decompressedSize = fileByteBuffer.readUint32();

        if (fileByteBuffer.readUint16() !== VZIP_FOOTER) {
            throw new Error("Didn't see expected VZip footer");
        }

        const uncompressedSizeBuffer = Buffer.alloc(8);
        uncompressedSizeBuffer.writeUInt32LE(decompressedSize, 0);
        uncompressedSizeBuffer.writeUInt32LE(0, 4);

        return LZMA.decompress(
            Buffer.concat([properties, uncompressedSizeBuffer, compressedData]),
            (result, err) => {
                if (err) return reject(err);
                // Return the decompressed data
                result = Buffer.from(result); // it's a byte array
                resolve(result);
            },
        );
    });
}

decompressVZip(Buffer.from(workerData))
    .then((decompressedData) => {
        parentPort.postMessage({ success: true, data: decompressedData });
    })
    .catch((error) => {
        parentPort.postMessage({ success: false, error: error.message });
    });
