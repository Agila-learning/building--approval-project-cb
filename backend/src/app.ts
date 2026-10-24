import express from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to the Building Approval Software API. The API is available at /api');
});

app.use('/api', routes);

app.use(errorHandler);

export default app;
