export const exampleService = {
  getExampleData: async () => {
    // This would typically involve database operations or external API calls
    return {
      data: 'Example data from service',
      timestamp: new Date()
    };
  }
};