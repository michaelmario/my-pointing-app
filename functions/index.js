const functions = require('firebase-functions')
const admin = require('firebase-admin')
const nodemailer = require('nodemailer')

admin.initializeApp()

exports.sendEmailNotification = functions.https.onCall(async (data, context) => {
  // Configuration de votre transporteur email
  const transporter = nodemailer.createTransport({
    // ... votre configuration SMTP
  })

  const mailOptions = {
    from: 'votre-app@domaine.com',
    to: 'admin@domaine.com',
    subject: `Nouveau message ${data.priority}: ${data.title}`,
    html: `
      <h2>Nouveau message de ${data.senderName}</h2>
      <p><strong>Priorité:</strong> ${data.priority}</p>
      <p><strong>Catégorie:</strong> ${data.category}</p>
      <p><strong>Sujet:</strong> ${data.title}</p>
      <p><a href="votre-url/messages/${data.messageId}">Voir le message</a></p>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error('Erreur d\'envoi d\'email:', error)
    throw new functions.https.HttpsError('internal', 'Erreur d\'envoi d\'email')
  }
}) 