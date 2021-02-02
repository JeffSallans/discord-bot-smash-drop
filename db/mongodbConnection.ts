import { connect, connection, Connection } from 'mongoose';

export const setupConnection = async (mongoUrl: string): Promise<Connection> => {
  connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });

  return new Promise((resolve, reject) => {
    const db = connection;
    db.on('error', (error) => {
      console.error('connection error:', error)
      reject(error);
    });
    db.once('open', function() {
      console.debug('MongoDB connected');
      resolve(db);
    });
  });
};