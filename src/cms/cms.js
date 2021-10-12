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
    return `< instagram ${ obj.pid } >`;
  },
  toPreview: function (obj) {
    return `< instagram ${ obj.pid } >`;
  },
});

CMS.registerEditorComponent({
  id: "vimeo",
  label: "Vimeo",
  fields: [{
    name: "id",
    label: "Vimeo ID",
    widget: "string"
  }],
  pattern: /{{<ReactVimeo ([a-zA-Z0-9]+) >}}/,
  fromBlock: function (match) {
    return {
      id: match[1]
    };
  },
  toBlock: function (obj) {
    return `<ReactVimeo id="${ obj.id }" />`;
  },
  toPreview: function (obj) {
    return `<ReactVimeo id="${ obj.id }" />`;
  },
});

CMS.registerEditorComponent({
  id: "ReactYoutube",
  label: "React Youtube",
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
  pattern: /{{<ReactYouTube ([a-zA-Z0-9]+) >}}/,
  fromBlock: function (match) {
    return {
      id: match[1],
    };
  },
  toBlock: function (obj) {
    return ` <ReactYouTube videoId="${ obj.id }" width="${ obj.width }" height="${ obj.height }" />`;
  },
  toPreview: function (obj) {
    return ` <ReactYouTube videoId="${ obj.id }" width="${ obj.width }" height="${ obj.height }" />`;

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

