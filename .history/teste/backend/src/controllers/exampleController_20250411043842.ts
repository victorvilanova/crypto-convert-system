import { Request, Response } from 'express';

export const exampleController = {
  getExample: async (req: Request, res: Response) => {
    try {
      // Example controller logic
      res.status(200).json({ message: 'Example endpoint working' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};