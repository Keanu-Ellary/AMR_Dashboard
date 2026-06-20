import { S3Client } from "@aws-sdk/client-s3";

const isTestMode = process.env.NODE_ENV ==="test" || process.env.USE_MINIO==="true";

export const s3Client = new S3Client(
    !isTestMode
        ? {
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            }
        }
        : {
            region: "us-east-1",
            endpoint: "http://127.0.0.1:9000",
            forcePathStyle: true,
            credentials: {
                accessKeyId: process.env.MINIO_ACCESS_KEY!,
                secretAccessKey: process.env.MINIO_SECRET_KEY!,
            },
        }

)

export const BUCKET = process.env.S3_BUCKET;

export const getImageUrl = (fileName: string) =>
    isTestMode
    ? `http://127.0.0.1:9000/${BUCKET}/${fileName}`
    : `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
