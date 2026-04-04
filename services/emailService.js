/**
 * Service d'email - Envoie les emails de vérification et notifications
 */
const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

// Debug: Log environment variables
const emailUser = process.env.EMAIL_USER || "ivoirestore878@gmail.com";
const emailPassword = process.env.EMAIL_PASSWORD || "";

logger.info(`[EMAIL DEBUG] EMAIL_USER: ${emailUser}`);
logger.info(`[EMAIL DEBUG] EMAIL_PASSWORD length: ${emailPassword.length} chars`);
logger.info(`[EMAIL DEBUG] EMAIL_PASSWORD starts with: ${emailPassword.substring(0, 5)}...`);

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: emailUser,
    pass: emailPassword, // Utiliser App Password pour Gmail
  },
});

// Test transporter au démarrage
transporter.verify((error, success) => {
  if (error) {
    logger.error(
      "❌ Erreur de configuration email transporter:",
      error.message
    );
    logger.error(`[EMAIL DEBUG] User configured: ${emailUser}`);
    logger.error(`[EMAIL DEBUG] Password configured: ${emailPassword ? "YES (" + emailPassword.length + " chars)" : "NO"}`);
  } else {
    logger.info("✅ Email transporter configuré avec succès");
    logger.info(`[EMAIL DEBUG] Connected to: ${emailUser}`);
  }
});

/**
 * Envoie un email de vérification de boutiqu
 * @param {Object} options
 * @param {string} options.email - Email du vendeur
 * @param {string} options.boutiqueName - Nom de la boutique
 * @param {string} options.verificationLink - Lien de vérification complet
 */
exports.sendVerificationEmail = async ({
  email,
  boutiqueName,
  verificationLink,
}) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || "ivoirestore878@gmail.com",
      to: email,
      subject: "🎉 Vérifiez votre adresse email - IvoireStore",
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
            .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bienvenue sur IvoireStore! 🎉</h1>
            </div>
            
            <div class="content">
              <h2>Vérifiez votre adresse email</h2>
              
              <p>Bonjour,</p>
              
              <p>Merci de vous être enregistré avec la boutique <strong>"${boutiqueName}"</strong> sur IvoireStore.</p>
              
              <p>Pour activer votre boutique et commencer à vendre, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous:</p>
              
              <a href="${verificationLink}" class="button">✓ Vérifier mon email</a>
              
              <p><strong>Ou copiez-collez ce lien dans votre navigateur:</strong></p>
              <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px; font-size: 12px;">
                ${verificationLink}
              </p>
              
              <div class="alert">
                <strong>⚠️ Important:</strong> Ce lien expire dans 24 heures. Si vous n'avez pas créé ce compte, ignorez cet email.
              </div>
              
              <p>Après vérification, votre boutique sera visible sur IvoireStore et vous pourrez commencer à créer des listings de produits.</p>
              
              <p>Des questions? Contactez-nous à <strong>ivoirestore878@gmail.com</strong></p>
            </div>
            
            <div class="footer">
              <p>&copy; 2026 IvoireStore. Tous droits réservés.</p>
              <p>Cette email a été envoyée à ${email}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Email de vérification envoyé à ${email} pour la boutique ${boutiqueName}`);
    return true;
  } catch (error) {
    logger.error(`Erreur lors de l'envoi d'email à ${email}:`, error);
    throw error;
  }
};

/**
 * Envoie un email de confirmation de vérification
 * @param {Object} options
 * @param {string} options.email - Email du vendeur
 * @param {string} options.boutiqueName - Nom de la boutique
 * @param {string} options.dashboardLink - Lien vers le dashboard
 */
exports.sendVerificationConfirmation = async ({
  email,
  boutiqueName,
  dashboardLink,
}) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || "ivoirestore878@gmail.com",
      to: email,
      subject: "✓ Votre email est vérifié - Bienvenue sur IvoireStore!",
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .success { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; color: #065f46; }
            .content { background: #f9fafb; padding: 30px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Email Vérifié!</h1>
            </div>
            
            <div class="content">
              <div class="success">
                <strong>Félicitations!</strong> Votre adresse email a été vérifiée avec succès.
              </div>
              
              <h2>Bienvenue ${boutiqueName}!</h2>
              
              <p>Votre boutique est maintenant active sur IvoireStore et visible aux clients.</p>
              
              <p>Prochaines étapes:</p>
              <ul>
                <li>Accédez à votre tableau de bord pour gérer votre boutique</li>
                <li>Commencez à ajouter vos produits</li>
                <li>Gérez vos commandes et paiements</li>
              </ul>
              
              <a href="${dashboardLink}" class="button">→ Accéder au Dashboard</a>
              
              <p>En cas de problème, n'hésitez pas à nous contacter: <strong>ivoirestore878@gmail.com</strong></p>
            </div>
            
            <div class="footer">
              <p>&copy; 2026 IvoireStore. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Email de confirmation envoyé à ${email}`);
    return true;
  } catch (error) {
    logger.error(`Erreur lors de l'envoi d'email de confirmation à ${email}:`, error);
    throw error;
  }
};
