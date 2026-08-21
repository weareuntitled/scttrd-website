(function () {
  var ShowPreview = createClass({
    render: function () {
      var data = this.props.entry.getIn(['data']).toJS();
      var image = data.image || '';

      return h('div', { className: 'body-container' }, [
        h('link', { rel: 'stylesheet', href: '/css/normalize.css' }),
        h('link', { rel: 'stylesheet', href: '/css/webflow.css' }),
        h('link', { rel: 'stylesheet', href: '/css/scttrd-websitze.webflow.css' }),
        h('style', {}, [
          '.customers-el:hover .customers-el-img { display: block; }',
          '.customers-el:hover .customers-el-img-pic { opacity: 1; }',
          '.customers-el:hover { background-color: #ff0000; color: #000000; }',
          '.customers-el:hover .heading-7, .customers-el:hover .heading-8 { color: #000000; }',
          '.customers-el { cursor: pointer; }',
        ].join('')),
        h('div', { className: 'wrapper' }, [
          h('div', { className: 'customers-grid' }, [
            h('div', { className: 'customers-list' }, [
              h('div', { className: 'customers-el' }, [
                h('div', { className: 'customers-el-name' }, [
                  h('h6', { className: 'heading-7' }, data.venue || 'Venue'),
                ]),
                h('div', { className: 'customers-el-service' }, [
                  h('h6', { className: 'heading-8' }, data.city || 'Stadt'),
                ]),
                h('div', { className: 'customers-el-date' }, [
                  h('h6', {}, data.date || 'Datum'),
                ]),
                h('div', { className: 'customers-el-img' },
                  image ? h('img', { className: 'customers-el-img-pic', src: image, alt: data.imageAlt || '' }) : null
                ),
              ]),
            ]),
          ]),
        ]),
      ]);
    },
  });

  CMS.registerPreviewTemplate('shows', ShowPreview);

  CMS.registerPreviewStyle('/admin/cms.css');
})();