import mongoose from 'mongoose';

export async function connectDatabase(uri: string): Promise<void> {
  await mongoose.connect(uri, {
    // Atlas connectivity on some Windows/ISP setups is more stable on IPv4.
    family: 4,
    tls: true,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000
  });
}

