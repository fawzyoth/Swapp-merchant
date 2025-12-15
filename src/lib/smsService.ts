/**
 * SMS Service - Console/Log Mode
 *
 * This service simulates SMS sending by logging to the console.
 * In production, replace the sendSMS function with a real SMS API (Twilio, Vonage, etc.)
 */

const APP_URL = "https://fawzyoth.github.io/Swapp-app";

// URL shortener simulation (in production, use bit.ly or similar)
const shortenUrl = (url: string): string => {
  // For now, just return a compact version
  return url.replace("https://fawzyoth.github.io/Swapp-app/#", APP_URL + "/#");
};

// Generate tracking link
export const getTrackingLink = (exchangeCode: string): string => {
  return `${APP_URL}/#/client/tracking/${exchangeCode}`;
};

// Generate messaging link
export const getMessagingLink = (exchangeId: string): string => {
  return `${APP_URL}/#/client/chat/${exchangeId}`;
};

// Generate exchange detail link
export const getExchangeLink = (exchangeCode: string): string => {
  return `${APP_URL}/#/client/exchange/${exchangeCode}`;
};

interface SMSPayload {
  to: string;
  message: string;
  type: 'rejection' | 'acceptance' | 'message' | 'status_change' | 'general';
}

/**
 * Send SMS (Console Mode)
 * In production, replace this with actual SMS API call
 */
export const sendSMS = async (payload: SMSPayload): Promise<boolean> => {
  const timestamp = new Date().toLocaleString('fr-FR');

  console.log('\n========================================');
  console.log('📱 SMS NOTIFICATION (Console Mode)');
  console.log('========================================');
  console.log(`📅 Time: ${timestamp}`);
  console.log(`📞 To: ${payload.to}`);
  console.log(`📋 Type: ${payload.type.toUpperCase()}`);
  console.log('----------------------------------------');
  console.log(`💬 Message:`);
  console.log(payload.message);
  console.log('========================================\n');

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  return true;
};

/**
 * SMS Templates
 */

// When merchant REJECTS an exchange
export const sendRejectionSMS = async (
  clientPhone: string,
  clientName: string,
  exchangeCode: string,
  reason: string
): Promise<boolean> => {
  const message = `SWAPP - Demande refusee

Bonjour ${clientName},

Votre demande d'echange ${exchangeCode} a ete refusee.

Raison: ${reason}

Pour plus d'informations, scannez le QR code de votre bordereau ou contactez le commercant.

SWAPP`;

  return sendSMS({
    to: clientPhone,
    message,
    type: 'rejection'
  });
};

// When merchant ACCEPTS an exchange
export const sendAcceptanceSMS = async (
  clientPhone: string,
  clientName: string,
  exchangeCode: string,
  estimatedDate?: string
): Promise<boolean> => {
  const trackingLink = getTrackingLink(exchangeCode);
  const dateInfo = estimatedDate
    ? `Date estimee de reception: ${estimatedDate}`
    : `Vous serez informe de la date de livraison.`;

  const message = `SWAPP - Echange accepte!

Bonjour ${clientName},

Votre demande d'echange ${exchangeCode} a ete ACCEPTEE!

${dateInfo}

Suivez votre echange:
${trackingLink}

SWAPP`;

  return sendSMS({
    to: clientPhone,
    message,
    type: 'acceptance'
  });
};

// When merchant sends a MESSAGE
export const sendMessageNotificationSMS = async (
  clientPhone: string,
  clientName: string,
  exchangeCode: string,
  exchangeId: string
): Promise<boolean> => {
  const messagingLink = getMessagingLink(exchangeId);

  const message = `SWAPP - Nouveau message

Bonjour ${clientName},

Vous avez recu un nouveau message concernant votre echange ${exchangeCode}.

Consultez vos messages:
${messagingLink}

Ou scannez le QR code de votre bordereau.

SWAPP`;

  return sendSMS({
    to: clientPhone,
    message,
    type: 'message'
  });
};

// When STATUS changes
export const sendStatusChangeSMS = async (
  clientPhone: string,
  clientName: string,
  exchangeCode: string,
  newStatus: string,
  statusLabel: string
): Promise<boolean> => {
  const trackingLink = getTrackingLink(exchangeCode);

  let statusMessage = '';
  switch (newStatus) {
    case 'validated':
      statusMessage = 'Votre echange a ete valide et sera bientot prepare.';
      break;
    case 'preparing':
      statusMessage = 'Votre colis est en cours de preparation au mini-depot.';
      break;
    case 'in_transit':
      statusMessage = 'Votre colis est en route vers vous!';
      break;
    case 'delivery_verified':
      statusMessage = 'Le livreur a verifie et accepte votre echange.';
      break;
    case 'delivery_rejected':
      statusMessage = 'Le livreur a signale un probleme avec l\'echange.';
      break;
    case 'completed':
      statusMessage = 'Votre echange est termine avec succes! Merci.';
      break;
    case 'returned':
      statusMessage = 'Le produit a ete retourne.';
      break;
    default:
      statusMessage = `Nouveau statut: ${statusLabel}`;
  }

  const message = `SWAPP - Mise a jour

Bonjour ${clientName},

Echange ${exchangeCode}:
${statusMessage}

Statut: ${statusLabel}

Suivez votre echange:
${trackingLink}

SWAPP`;

  return sendSMS({
    to: clientPhone,
    message,
    type: 'status_change'
  });
};

// Export all functions
export default {
  sendSMS,
  sendRejectionSMS,
  sendAcceptanceSMS,
  sendMessageNotificationSMS,
  sendStatusChangeSMS,
  getTrackingLink,
  getMessagingLink,
  getExchangeLink
};
