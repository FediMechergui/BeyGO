import emailjs from '@emailjs/browser';
import { Platform } from 'react-native';

// EmailJS Configuration
const EMAILJS_CONFIG = {
  serviceId: process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID || 'service_beygo',
  publicKey: process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY || 'your_public_key',
  templates: {
    welcome: 'template_welcome',
    rewardClaimed: 'template_reward',
    puzzleCompleted: 'template_puzzle',
    achievementUnlocked: 'template_achievement',
    visitConfirmation: 'template_visit',
    passwordReset: 'template_password_reset',
    newsletter: 'template_newsletter',
  },
};

// Initialize EmailJS (call this in app initialization)
export const initEmailJS = () => {
  try {
    emailjs.init(EMAILJS_CONFIG.publicKey);
    console.log('EmailJS initialized successfully');
    return true;
  } catch (error) {
    console.error('EmailJS initialization failed:', error);
    return false;
  }
};

/**
 * Send email using EmailJS
 * @param {string} templateId - Template ID from EmailJS
 * @param {object} templateParams - Template parameters
 * @returns {Promise<object>} - EmailJS response
 */
export const sendEmail = async (templateId, templateParams) => {
  try {
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      templateId,
      templateParams,
      EMAILJS_CONFIG.publicKey
    );
    
    console.log('Email sent successfully:', response);
    return { success: true, response };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email to new user
 */
export const sendWelcomeEmail = async (user) => {
  const templateParams = {
    to_name: user.name || user.username,
    to_email: user.email,
    app_name: 'BeyGo',
    dashboard_url: 'https://beygo.app/dashboard',
    support_email: 'support@beygo.app',
    // Tunisian welcome message
    welcome_message: 'مرحبا بك في رحلة استكشاف تاريخ البايات',
    message: `Welcome to BeyGo! Start your journey exploring the rich history of Tunisian Beys. 
    Visit museums, solve AR puzzles, and collect historical artifacts to earn rewards.`,
  };

  return sendEmail(EMAILJS_CONFIG.templates.welcome, templateParams);
};

/**
 * Send reward claimed confirmation
 */
export const sendRewardClaimedEmail = async (user, reward) => {
  const templateParams = {
    to_name: user.name || user.username,
    to_email: user.email,
    reward_name: reward.name,
    reward_description: reward.description,
    points_spent: reward.pointsCost,
    remaining_points: user.points,
    reward_code: reward.redemptionCode,
    expiry_date: reward.expiryDate ? new Date(reward.expiryDate).toLocaleDateString() : 'No expiry',
    claim_date: new Date().toLocaleDateString(),
    partner_name: reward.partner?.name || 'BeyGo',
    partner_location: reward.partner?.location || 'Various locations',
    terms_conditions: reward.termsAndConditions || 'Standard terms apply',
  };

  return sendEmail(EMAILJS_CONFIG.templates.rewardClaimed, templateParams);
};

/**
 * Send puzzle completion congratulations
 */
export const sendPuzzleCompletedEmail = async (user, puzzle, bey) => {
  const templateParams = {
    to_name: user.name || user.username,
    to_email: user.email,
    puzzle_name: puzzle.name || 'Historical Puzzle',
    bey_name: bey.name,
    bey_title: bey.title || 'Bey of Tunis',
    bey_dynasty: bey.dynasty?.name || 'Unknown Dynasty',
    points_earned: puzzle.pointsReward,
    total_points: user.points + puzzle.pointsReward,
    completion_time: puzzle.completionTime || 'N/A',
    museum_name: puzzle.museum?.name || 'Historical Museum',
    historical_fact: bey.description || 'An important figure in Tunisian history.',
    next_challenge: 'Continue exploring to discover more Beys!',
  };

  return sendEmail(EMAILJS_CONFIG.templates.puzzleCompleted, templateParams);
};

/**
 * Send achievement unlocked notification
 */
export const sendAchievementEmail = async (user, achievement) => {
  const templateParams = {
    to_name: user.name || user.username,
    to_email: user.email,
    achievement_name: achievement.name,
    achievement_description: achievement.description,
    achievement_icon: achievement.icon,
    badge_level: achievement.level || 'Bronze',
    points_bonus: achievement.pointsBonus || 0,
    unlock_date: new Date().toLocaleDateString(),
    total_achievements: user.achievements?.length || 1,
    share_message: `I just unlocked "${achievement.name}" on BeyGo! Join me in exploring Tunisian history.`,
  };

  return sendEmail(EMAILJS_CONFIG.templates.achievementUnlocked, templateParams);
};

/**
 * Send museum visit confirmation
 */
export const sendVisitConfirmationEmail = async (user, visit, museum) => {
  const templateParams = {
    to_name: user.name || user.username,
    to_email: user.email,
    museum_name: museum.name,
    museum_location: `${museum.city}, Tunisia`,
    visit_date: new Date(visit.visitedAt).toLocaleDateString(),
    visit_time: new Date(visit.visitedAt).toLocaleTimeString(),
    duration: visit.duration ? `${Math.round(visit.duration / 60)} minutes` : 'N/A',
    hotspots_visited: visit.hotspotsVisited?.length || 0,
    puzzles_completed: visit.puzzlesCompleted?.length || 0,
    artifacts_collected: visit.artifactsCollected?.length || 0,
    points_earned: visit.pointsEarned || 0,
    beys_discovered: visit.beysDiscovered?.join(', ') || 'None yet',
    visit_summary: `Thank you for visiting ${museum.name}! You explored ${visit.hotspotsVisited?.length || 0} AR hotspots and earned ${visit.pointsEarned || 0} points.`,
    next_museum: 'Check the app for nearby museums to continue your journey!',
  };

  return sendEmail(EMAILJS_CONFIG.templates.visitConfirmation, templateParams);
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (user, resetToken) => {
  const templateParams = {
    to_name: user.name || user.username,
    to_email: user.email,
    reset_link: `https://beygo.app/reset-password?token=${resetToken}`,
    reset_code: resetToken.slice(-6).toUpperCase(), // Last 6 characters as code
    expiry_time: '1 hour',
    support_email: 'support@beygo.app',
  };

  return sendEmail(EMAILJS_CONFIG.templates.passwordReset, templateParams);
};

/**
 * Send newsletter/update email
 */
export const sendNewsletterEmail = async (user, newsletter) => {
  const templateParams = {
    to_name: user.name || user.username,
    to_email: user.email,
    subject: newsletter.subject,
    content: newsletter.content,
    new_features: newsletter.features?.join('\n• ') || '',
    upcoming_events: newsletter.events?.map(e => `${e.name} - ${e.date}`).join('\n') || '',
    special_offers: newsletter.offers || '',
    unsubscribe_link: `https://beygo.app/unsubscribe?email=${encodeURIComponent(user.email)}`,
  };

  return sendEmail(EMAILJS_CONFIG.templates.newsletter, templateParams);
};

/**
 * Batch send emails (for admin use)
 */
export const sendBatchEmails = async (users, templateId, getTemplateParams) => {
  const results = [];
  
  for (const user of users) {
    try {
      const params = getTemplateParams(user);
      const result = await sendEmail(templateId, params);
      results.push({ user: user.email, ...result });
      
      // Rate limiting - wait 100ms between emails
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      results.push({ user: user.email, success: false, error: error.message });
    }
  }
  
  return results;
};

export default {
  initEmailJS,
  sendEmail,
  sendWelcomeEmail,
  sendRewardClaimedEmail,
  sendPuzzleCompletedEmail,
  sendAchievementEmail,
  sendVisitConfirmationEmail,
  sendPasswordResetEmail,
  sendNewsletterEmail,
  sendBatchEmails,
  EMAILJS_CONFIG,
};
