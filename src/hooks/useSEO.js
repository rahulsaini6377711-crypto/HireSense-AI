import { useEffect } from 'react';

/**
 * Hook to set page title and meta description dynamically for SEO
 * @param {string} title 
 * @param {string} description 
 */
export const useSEO = (title, description) => {
  useEffect(() => {
    // Set document title
    const prevTitle = document.title;
    document.title = title ? `${title} | HireSense AI` : 'HireSense AI - Advanced Career Platform';

    // Set meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    let prevDescription = '';
    
    if (metaDescription) {
      prevDescription = metaDescription.getAttribute('content');
      if (description) {
        metaDescription.setAttribute('content', description);
      }
    } else if (description) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      metaDescription.content = description;
      document.head.appendChild(metaDescription);
    }

    return () => {
      document.title = prevTitle;
      if (metaDescription && prevDescription) {
        metaDescription.setAttribute('content', prevDescription);
      }
    };
  }, [title, description]);
};

export default useSEO;
