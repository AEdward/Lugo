const { NewsletterSubscriber } = require('../models');

async function subscribe(email, source) {
  const normalized = email.trim().toLowerCase();
  const [subscriber] = await NewsletterSubscriber.findOrCreate({
    where: { email: normalized },
    defaults: { source: source || null },
  });

  if (!subscriber.subscribed) {
    subscriber.subscribed = true;
    await subscriber.save();
  }

  return subscriber;
}

async function unsubscribeByToken(token) {
  const subscriber = await NewsletterSubscriber.findOne({ where: { unsubscribeToken: token } });
  if (!subscriber) return null;
  subscriber.subscribed = false;
  await subscriber.save();
  return subscriber;
}

module.exports = { subscribe, unsubscribeByToken };
