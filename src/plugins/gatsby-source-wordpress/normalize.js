"use strict";

const crypto = require(`crypto`);

const deepMapKeys = require(`deep-map-keys`);

const _ = require(`lodash`);

const {
  createRemoteFileNode
} = require(`gatsby-source-filesystem`);

const {
  URL
} = require(`url`);

const colorized = require(`./output-color`);

const conflictFieldPrefix = `wordpress_`; // restrictedNodeFields from here https://www.gatsbyjs.org/docs/node-interface/

const restrictedNodeFields = [`id`, `children`, `parent`, `fields`, `internal`];
/**
 * Encrypts a String using md5 hash of hexadecimal digest.
 *
 * @param {any} str
 */

const digest = str => crypto.createHash(`md5`).update(str).digest(`hex`);
/**
 * Validate the GraphQL naming convetions & protect specific fields.
 *
 * @param {any} key
 * @returns the valid name
 */


function getValidKey({
  key,
  verbose = false
}) {
  let nkey = String(key);
  const NAME_RX = /^[_a-zA-Z][_a-zA-Z0-9]*$/;
  let changed = false; // Replace invalid characters

  if (!NAME_RX.test(nkey)) {
    changed = true;
    nkey = nkey.replace(/-|__|:|\.|\s/g, `_`);
  } // Prefix if first character isn't a letter.


  if (!NAME_RX.test(nkey.slice(0, 1))) {
    changed = true;
    nkey = `${conflictFieldPrefix}${nkey}`;
  }

  if (restrictedNodeFields.includes(nkey)) {
    changed = true;
    nkey = `${conflictFieldPrefix}${nkey}`.replace(/-|__|:|\.|\s/g, `_`);
  }

  if (changed && verbose) console.log(colorized.out(`Object with key "${key}" breaks GraphQL naming convention. Renamed to "${nkey}"`, colorized.color.Font.FgRed));
  return nkey;
}

exports.getValidKey = getValidKey; // Remove the ACF key from the response when it's not an object

const normalizeACF = entities => entities.map(e => {
  if (!_.isPlainObject(e[`acf`])) {
    delete e[`acf`];
  }

  return e;
});

exports.normalizeACF = normalizeACF; // Combine all ACF Option page data

exports.combineACF = function (entities) {
  let acfOptionData = {}; // Map each ACF Options object keys/data to single object

  _.forEach(entities.filter(e => e.__type === `wordpress__acf_options`), e => {
    if (e[`acf`]) {
      acfOptionData[e.__acfOptionPageId || `options`] = {};
      Object.keys(e[`acf`]).map(k => acfOptionData[e.__acfOptionPageId || `options`][k] = e[`acf`][k]);
    }
  }); // Remove previous ACF Options objects (if any)


  _.pullAll(entities, entities.filter(e => e.__type === `wordpress__acf_options`)); // Create single ACF Options object


  entities.push({
    acf: acfOptionData || false,
    __type: `wordpress__acf_options`
  });
  return entities;
}; // Create entities from the few the WordPress API returns as an object for presumably
// legacy reasons.


const normalizeEntities = entities => {
  const mapType = e => Object.keys(e).filter(key => key !== `__type`).map(key => {
    return {
      id: key,
      ...e[key],
      __type: e.__type
    };
  });

  return entities.reduce((acc, e) => {
    switch (e.__type) {
      case `wordpress__wp_types`:
        return acc.concat(mapType(e));

      case `wordpress__wp_api_menus_menu_locations`:
        return acc.concat(mapType(e));

      case `wordpress__wp_statuses`:
        return acc.concat(mapType(e));

      case `wordpress__wp_taxonomies`:
        return acc.concat(mapType(e));

      case `wordpress__acf_options`:
        return acc.concat(mapType(e));

      default:
        return acc.concat(e);
    }
  }, []);
};

exports.normalizeEntities = normalizeEntities; // Standardize ids + make sure keys are valid.

exports.standardizeKeys = entities => entities.map(e => deepMapKeys(e, key => key === `ID` ? getValidKey({
  key: `id`
}) : getValidKey({
  key
}))); // Standardize dates on ISO 8601 version.


exports.standardizeDates = entities => entities.map(e => {
  Object.keys(e).forEach(key => {
    if (e[`${key}_gmt`]) {
      e[key] = new Date(e[`${key}_gmt`] + `z`).toJSON();
      delete e[`${key}_gmt`];
    }
  });
  return e;
}); // Lift "rendered" fields to top-level


exports.liftRenderedField = entities => entities.map(e => {
  Object.keys(e).forEach(key => {
    const value = e[key];

    if (_.isObject(value) && _.isString(value.rendered)) {
      e[key] = value.rendered;
    }
  });
  return e;
}); // Exclude entities of unknown shape
// Assume all entities contain a wordpress_id,
// except for whitelisted type wp_settings and the site_metadata


exports.excludeUnknownEntities = entities => entities.filter(e => e.wordpress_id || e.__type === `wordpress__wp_settings` || e.__type === `wordpress__site_metadata`); // Excluding entities without ID, or WP Settings
// Create node ID from known entities
// excludeUnknownEntities whitelisted types don't contain a wordpress_id
// we create the node ID based upon type if the wordpress_id doesn't exist


exports.createGatsbyIds = (createNodeId, entities, _siteURL) => entities.map(e => {
  if (e.wordpress_id) {
    e.id = createNodeId(`${e.__type}-${e.wordpress_id.toString()}-${_siteURL}`);
  } else {
    e.id = createNodeId(`${e.__type}-${_siteURL}`);
  }

  return e;
}); // Build foreign reference map.


exports.mapTypes = entities => {
  const groups = _.groupBy(entities, e => e.__type);

  for (let groupId in groups) {
    groups[groupId] = groups[groupId].map(e => {
      return {
        wordpress_id: e.wordpress_id,
        id: e.id
      };
    });
  }

  return groups;
};

exports.mapAuthorsToUsers = entities => {
  const users = entities.filter(e => e.__type === `wordpress__wp_users`);
  return entities.map(e => {
    if (users.length && e.author) {
      // Find the user
      const user = users.find(u => u.wordpress_id === e.author);

      if (user) {
        e.author___NODE = user.id; // Add a link to the user to the entity.

        if (!user.all_authored_entities___NODE) {
          user.all_authored_entities___NODE = [];
        }

        user.all_authored_entities___NODE.push(e.id);

        if (!user[`authored_${e.__type}___NODE`]) {
          user[`authored_${e.__type}___NODE`] = [];
        }

        user[`authored_${e.__type}___NODE`].push(e.id);
        delete e.author;
      }
    }

    return e;
  });
};

exports.mapPostsToTagsCategories = entities => {
  const categoryTypes = [`wordpress__wc_categories`, `wordpress__CATEGORY`];
  const tagTypes = [`wordpress__TAG`, `wordpress__wc_tags`];
  const tags = entities.filter(e => tagTypes.includes(e.__type));
  const categories = entities.filter(e => categoryTypes.includes(e.__type));
  return entities.map(e => {
    // Replace tags & categories with links to their nodes.
    let entityHasTags = e.tags && Array.isArray(e.tags) && e.tags.length;

    if (tags.length && entityHasTags) {
      e.tags___NODE = e.tags.map(t => tags.find(tObj => (Number.isInteger(t) ? t : t.wordpress_id) === tObj.wordpress_id).id);
      delete e.tags;
    }

    let entityHasCategories = e.categories && Array.isArray(e.categories) && e.categories.length;

    if (categories.length && entityHasCategories) {
      e.categories___NODE = e.categories.map(c => categories.find(cObj => (Number.isInteger(c) ? c : c.wordpress_id) === cObj.wordpress_id).id);
      delete e.categories;
    }

    return e;
  });
}; // TODO generalize this for all taxonomy types.


exports.mapTagsCategoriesToTaxonomies = entities => entities.map(e => {
  // Where should api_menus stuff link to?
  if (e.taxonomy && e.__type !== `wordpress__wp_api_menus_menus`) {
    // Replace taxonomy with a link to the taxonomy node.
    const taxonomyNode = entities.find(t => t.wordpress_id === e.taxonomy);

    if (taxonomyNode) {
      e.taxonomy___NODE = taxonomyNode.id;
      delete e.taxonomy;
    }
  }

  return e;
});

exports.mapElementsToParent = entities => entities.map(e => {
  if (e.wordpress_parent) {
    // Create parent_element with a link to the parent node of type.
    const parentElement = entities.find(t => t.wordpress_id === e.wordpress_parent && t.__type === e.__type);

    if (parentElement) {
      e.parent_element___NODE = parentElement.id;
    }
  }

  return e;
});

exports.mapPolylangTranslations = entities => entities.map(entity => {
  if (entity.polylang_translations) {
    entity.polylang_translations___NODE = entity.polylang_translations.map(translation => entities.find(t => t.wordpress_id === translation.wordpress_id && entity.__type === t.__type).id);
    delete entity.polylang_translations;
  }

  return entity;
});

exports.searchReplaceContentUrls = function ({
  entities,
  searchAndReplaceContentUrls
}) {
  if (!_.isPlainObject(searchAndReplaceContentUrls) || !_.has(searchAndReplaceContentUrls, `sourceUrl`) || !_.has(searchAndReplaceContentUrls, `replacementUrl`) || typeof searchAndReplaceContentUrls.sourceUrl !== `string` || typeof searchAndReplaceContentUrls.replacementUrl !== `string`) {
    return entities;
  }

  const {
    sourceUrl,
    replacementUrl
  } = searchAndReplaceContentUrls;
  const _blacklist = [`_links`, `__type`];

  const blacklistProperties = function (obj = {}, blacklist = []) {
    for (var i = 0; i < blacklist.length; i++) {
      delete obj[blacklist[i]];
    }

    return obj;
  };

  return entities.map(function (entity) {
    const original = Object.assign({}, entity);

    try {
      var whiteList = blacklistProperties(entity, _blacklist);
      var replaceable = JSON.stringify(whiteList);
      var replaced = replaceable.replace(new RegExp(sourceUrl, `g`), replacementUrl);
      var parsed = JSON.parse(replaced);
    } catch (e) {
      console.log(colorized.out(e.message, colorized.color.Font.FgRed));
      return original;
    }

    return _.defaultsDeep(parsed, original);
  });
};

exports.mapEntitiesToMedia = entities => {
  const media = entities.filter(e => e.__type === `wordpress__wp_media`);
  return entities.map(e => {
    // Map featured_media to its media node
    // Check if it's value of ACF Image field, that has 'Return value' set to
    // 'Image Object' ( https://www.advancedcustomfields.com/resources/image/ )
    const isPhotoObject = field => _.isObject(field) && field.wordpress_id && field.url && field.width && field.height ? true : false;

    const isURL = value => _.isString(value) && value.startsWith(`http`);

    const isMediaUrlAlreadyProcessed = key => key == `source_url`;

    const isFeaturedMedia = (value, key) => (_.isNumber(value) || _.isBoolean(value)) && key === `featured_media`; // ACF Gallery and similarly shaped arrays


    const isArrayOfPhotoObject = field => _.isArray(field) && field.length > 0 && isPhotoObject(field[0]);

    const getMediaItemID = mediaItem => mediaItem ? mediaItem.id : null; // Try to get media node from value:
    //  - special case - check if key is featured_media and value is photo ID
    //  - check if value is media url
    //  - check if value is ACF Image Object
    //  - check if value is ACF Gallery


    const getMediaFromValue = (value, key) => {
      if (isFeaturedMedia(value, key)) {
        return {
          mediaNodeID: _.isNumber(value) ? getMediaItemID(media.find(m => m.wordpress_id === value)) : null,
          deleteField: true
        };
      } else if (isURL(value) && !isMediaUrlAlreadyProcessed(key)) {
        const mediaNodeID = getMediaItemID(media.find(m => m.source_url === value));
        return {
          mediaNodeID,
          deleteField: !!mediaNodeID
        };
      } else if (isPhotoObject(value)) {
        const mediaNodeID = getMediaItemID(media.find(m => m.source_url === value.url));
        return {
          mediaNodeID,
          deleteField: !!mediaNodeID
        };
      } else if (isArrayOfPhotoObject(value)) {
        return {
          mediaNodeID: value.map(item => getMediaFromValue(item, key).mediaNodeID).filter(id => id !== null),
          deleteField: true
        };
      }

      return {
        mediaNodeID: null,
        deleteField: false
      };
    };

    const replaceFieldsInObject = object => {
      let deletedAllFields = true;

      _.each(object, (value, key) => {
        const {
          mediaNodeID,
          deleteField
        } = getMediaFromValue(value, key);

        if (mediaNodeID) {
          object[`${key}___NODE`] = mediaNodeID;
        }

        if (deleteField) {
          delete object[key]; // We found photo node (even if it has no image),
          // We can end processing this path

          return;
        } else {
          deletedAllFields = false;
        }

        if (_.isArray(value)) {
          value.forEach(v => replaceFieldsInObject(v));
        } else if (_.isObject(value)) {
          replaceFieldsInObject(value);
        }
      }); // Deleting fields and replacing them with links to different nodes
      // can cause build errors if object will have only linked properites:
      // https://github.com/gatsbyjs/gatsby/blob/master/packages/gatsby/src/schema/infer-graphql-input-fields.js#L205
      // Hacky workaround:
      // Adding dummy field with concrete value (not link) fixes build


      if (deletedAllFields && object && _.isObject(object)) {
        object[`dummy`] = true;
      }
    };

    replaceFieldsInObject(e);
    return e;
  });
}; // Downloads media files and removes "sizes" data as useless in Gatsby context.


exports.downloadMediaFiles = async ({
  entities,
  store,
  cache,
  createNode,
  createNodeId,
  touchNode,
  _auth
}) => Promise.all(entities.map(async e => {
  let fileNodeID;

  if (e.__type === `wordpress__wp_media`) {
    const mediaDataCacheKey = `wordpress-media-${e.wordpress_id}`;
    const cacheMediaData = await cache.get(mediaDataCacheKey); // If we have cached media data and it wasn't modified, reuse
    // previously created file node to not try to redownload

    if (cacheMediaData && e.modified === cacheMediaData.modified) {
      fileNodeID = cacheMediaData.fileNodeID;
      touchNode({
        nodeId: cacheMediaData.fileNodeID
      });
    } // If we don't have cached data, download the file


    if (!fileNodeID) {
      try {
        const fileNode = await createRemoteFileNode({
          url: e.source_url,
          store,
          cache,
          createNode,
          createNodeId,
          parentNodeId: e.id,
          auth: _auth
        });

        if (fileNode) {
          fileNodeID = fileNode.id;
          await cache.set(mediaDataCacheKey, {
            fileNodeID,
            modified: e.modified
          });
        }
      } catch (e) {// Ignore
      }
    }
  }

  if (fileNodeID) {
    e.localFile___NODE = fileNodeID;
    delete e.media_details.sizes;
  }

  return e;
}));

const prepareACFChildNodes = (obj, entityId, topLevelIndex, type, children, childrenNodes) => {
  // Replace any child arrays with pointers to nodes
  _.each(obj, (value, key) => {
    if (_.isArray(value) && value[0] && value[0].acf_fc_layout) {
      obj[`${key}___NODE`] = value.map((v, indexItem) => prepareACFChildNodes(v, `${entityId}_${indexItem}`, topLevelIndex, type + key, children, childrenNodes).id);
      delete obj[key];
    }
  });

  const acfChildNode = { ...obj,
    id: entityId + topLevelIndex + type,
    parent: entityId,
    children: [],
    internal: {
      type,
      contentDigest: digest(JSON.stringify(obj))
    }
  };
  children.push(acfChildNode.id); // We recursively handle children nodes first, so we need
  // to make sure parent nodes will be before their children.
  // So let's use unshift to put nodes in the beginning.

  childrenNodes.unshift(acfChildNode);
  return acfChildNode;
};

exports.createNodesFromEntities = ({
  entities,
  createNode
}) => {
  entities.forEach(e => {
    // Create subnodes for ACF Flexible layouts
    let {
      __type,
      ...entity
    } = e; // eslint-disable-line no-unused-vars

    let children = [];
    let childrenNodes = [];

    if (entity.acf) {
      _.each(entity.acf, (value, key) => {
        if (_.isArray(value) && value[0] && value[0].acf_fc_layout) {
          entity.acf[`${key}_${entity.type}___NODE`] = entity.acf[key].map((f, i) => {
            const type = `WordPressAcf_${f.acf_fc_layout}`;
            delete f.acf_fc_layout;
            const acfChildNode = prepareACFChildNodes(f, entity.id + i, key, type, children, childrenNodes);
            return acfChildNode.id;
          });
          delete entity.acf[key];
        }
      });
    }

    let node = { ...entity,
      children,
      parent: null,
      internal: {
        type: e.__type,
        contentDigest: digest(JSON.stringify(entity))
      }
    };
    createNode(node);
    childrenNodes.forEach(node => {
      createNode(node);
    });
  });
};

exports.createUrlPathsFromLinks = entities => entities.map(e => {
  if (e.link && !e.path) {
    try {
      const link = new URL(e.link);
      e.path = link.pathname;
    } catch (error) {
      e.path = e.link;
    }
  }

  return e;
});