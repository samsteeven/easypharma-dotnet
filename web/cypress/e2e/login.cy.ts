describe('Login Functionality', () => {
    it('should successfully login with valid credentials', () => {
        cy.visit('/login')

        // Fill in the login form
        cy.get('input[name="email"]').type('patient@easypharma.cm')
        cy.get('input[name="password"]').type('password123')

        // Submit form
        cy.get('button[type="submit"]').click()

        // Check if redirected to dashboard or home
        cy.url().should('include', '/profile')
        // Adjust assertion based on actual redirect logic, often profile or home for patients
    })

    it('should show error message with invalid credentials', () => {
        cy.visit('/login')

        cy.get('input[name="email"]').type('wrong@email.com')
        cy.get('input[name="password"]').type('wrongpassword')
        cy.get('button[type="submit"]').click()

        // Check for error message visibility
        // Assuming there's a toaster or error alert
        cy.contains('Identifiants incorrects').should('be.visible')
        // Or generic error check
        // cy.get('.error-message').should('be.visible')
    })
})
