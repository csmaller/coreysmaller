import CMS from 'netlify-cms-app';
import uploadcare from 'netlify-cms-media-library-uploadcare';

CMS.registerPreviewStyle('/styles.css');
CMS.registerMediaLibrary(uploadcare);

CMS.registerEditorComponent({
  id: "instagram",
  label: "Instagram",
  fields: [{
    name: "pid",
    label: "Post id",
    widget: "string"
  }],
  pattern: /{{< instagram ([a-zA-Z0-9]+) >}}/,
  fromBlock: function (match) {
    return {
      pid: match[1]
    };
  },
  toBlock: function (obj) {
    return `{{< instagram ${ obj.pid } >}}`;
  },
  toPreview: function (obj) {
    return `{{< instagram ${ obj.pid } >}}`;
  },
});

CMS.registerEditorComponent({
  id: "vimeo",
  label: "Vimeo",
  fields: [{
    name: "shortcode",
    label: "Vimeo shortcode",
    widget: "string"
  }],
  pattern: /{{< vimeo ([a-zA-Z0-9]+) >}}/,
  fromBlock: function (match) {
    return {
      shortcode: match[1]
    };
  },
  toBlock: function (obj) {
    return `{{< vimeo ${ obj.shortcode } >}}`;
  },
  toPreview: function (obj) {
    return `{{< vimeo ${ obj.shortcode } >}}`;
  },
});
CMS.registerEditorComponent({
  id: "youtube",
  label: "Youtube",
  fields: [
    {
      name: "id",
      label: "Youtube Video ID",
      widget: "string"
    },
    {
      name: "width",
      label: "Width",
      widget: "string",
      default: '788'
    },
    {
      name: "height",
      label: "Height",
      widget: "string",
      default: '443'
    },
  ],
  pattern: /{{< youtube ([a-zA-Z0-9]+) >}}/,
  fromBlock: function (match) {
    return {
      id: match[1],
    };
  },
  toBlock: function (obj) {
    return `<iframe frameborder="0" scrolling="no" marginheight="0" marginwidth="0" width="${ obj.width }" height="${ obj.height }" type="text/html" src="https://www.youtube.com/embed/${ obj.id }?autoplay=0&fs=0&iv_load_policy=3&showinfo=0&rel=0&cc_load_policy=0&start=0&end=0&origin=http://youtubeembedcode.com"><div><small><a href="https://youtubeembedcode.com/pl/">youtubeembedcode pl</a></small></div><div><small><a href="https://campuspress.yale.edu/pioneer/making-your-gap-year-count/">pt utbildning</a></small></div><div><small><a href="https://youtubeembedcode.com/nl/">youtubeembedcode.com/nl/</a></small></div><div><small><a href="https://kasinoutansvensklicens.nu/">kasinoutansvensklicens.nu</a></small></div></iframe>`;

  },
  toPreview: function (obj) {
    return `<iframe frameborder="0" scrolling="no" marginheight="0" marginwidth="0" width="${ obj.width }" height="${ obj.height }" type="text/html" src="https://www.youtube.com/embed/${ obj.id }?autoplay=0&fs=0&iv_load_policy=3&showinfo=0&rel=0&cc_load_policy=0&start=0&end=0&origin=http://youtubeembedcode.com"><div><small><a href="https://youtubeembedcode.com/pl/">youtubeembedcode pl</a></small></div><div><small><a href="https://campuspress.yale.edu/pioneer/making-your-gap-year-count/">pt utbildning</a></small></div><div><small><a href="https://youtubeembedcode.com/nl/">youtubeembedcode.com/nl/</a></small></div><div><small><a href="https://kasinoutansvensklicens.nu/">kasinoutansvensklicens.nu</a></small></div></iframe>`;

  },
});

CMS.registerEditorComponent({
  id: "ImageResponsive",
  label: "Image-Responsive",
  fields: [{
    name: "title",
    label: "Title",
    widget: "string"
  },
  {
    name: "src",
    label: "Image Src",
    widget: "image"
  },
  {
    name: "class",
    label: "CSS Class",
    widget: "string"
  },
  ],
  pattern: /{{< img src="([a-zA-Z0-9-_ ]+)" title="([a-zA-Z0-9-_ ]+)" >}}/,
  fromBlock: function (match) {
    return {
      title: match[1],
      src: match[2],
    };
  },
  toBlock: function (obj) {
    return `<img src="${ obj.src }" title="${ obj.title }" class="${ obj.class }" />`;
  },
  toPreview: function (obj) {
    return `<img><img src=${ obj.src } alt=${ obj.title }><figcaption>${ obj.title }</figcaption></img>`;
  },
});

