function buildPageMeta(content, fallbackTitle, fallbackDescription) {
  return {
    title: (content && content.seoTitle) || fallbackTitle,
    description: (content && content.seoDescription) || fallbackDescription || '',
  };
}

module.exports = { buildPageMeta };
