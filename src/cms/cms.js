import CMS from 'netlify-cms-app';
import uploadcare from 'netlify-cms-media-library-uploadcare';

CMS.registerPreviewStyle('/styles.css');
CMS.registerMediaLibrary(uploadcare);