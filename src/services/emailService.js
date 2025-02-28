import { getFunctions, httpsCallable } from 'firebase/functions'

const functions = getFunctions()

export const sendEmailNotification = async (data) => {
  try {
    const sendEmail = httpsCallable(functions, 'sendEmailNotification')
    await sendEmail(data)
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error)
    throw error
  }
} 