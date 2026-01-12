module.exports = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Hello from Vercel API!",
    timestamp: new Date().toISOString()
  });
};
