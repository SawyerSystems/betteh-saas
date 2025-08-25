// Temporary test endpoint for parent dashboard verification
// This will be added to the existing routes

export function addParentTestRoutes(app: any, storage: any) {
  // Test endpoint to directly authenticate a parent for testing
  app.post('/api/test/parent/login', async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }
    
    try {
      // Find parent by email
      const parents = await storage.getAllParents();
      const parent = parents.find(p => p.email === email);
      
      if (!parent) {
        return res.status(404).json({ error: 'Parent not found' });
      }
      
      // Set session
      req.session.parentId = parent.id;
      req.session.parentEmail = parent.email;
      
      res.json({
        success: true,
        message: 'Test login successful',
        parentId: parent.id,
        parentEmail: parent.email
      });
      
    } catch (error) {
      console.error('Test parent login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  });
}