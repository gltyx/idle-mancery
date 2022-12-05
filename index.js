(function (factory) {
    typeof define === 'function' && define.amd ? define(factory) :
    factory();
})((function () { 'use strict';

    class VirtualDOM {
      static DOMNodes = {};
      static currentComponent = null;

      static convertTextToTag(elem) {
        if (typeof elem !== 'object') {
          return {
            name: elem,
            type: 'text',
            attributes: null,
            children: [],
            listeners: {}
          };
        }

        return elem;
      }

      static createVirtualElement(tagName, attrs = {}, ...children) {
        const isLazyComp = typeof tagName === 'object' && tagName.type === 'lazyComponent';

        if (typeof tagName === 'function' || isLazyComp) {
          const elem = {
            name: tagName.name,
            type: 'component',
            attributes: attrs,
            prevAttributes: {},
            isLazyComp,
            fn: isLazyComp ? tagName.fn : tagName
          };
          VirtualDOM.currentComponent = elem;
          const comp = isLazyComp ? tagName.fn(attrs, children) : tagName(attrs, children);
          elem.children = comp ? Array.isArray(comp) ? comp : [comp] : [];
          elem.hasChildComponents = Array.isArray(comp) ? comp.some(one => one && (one.hasChildComponents || one.type === 'component')) : comp && (comp.hasChildComponents || comp.type === 'component');
          /*const elem = {
              name: tagName.name,
              type: 'component',
              attributes: attrs,
              prevAttributes: {},
              isLazyComp,
              children: Array.isArray(comp) ? comp : [comp],
              fn: isLazyComp ? tagName.fn : tagName,
              hasChildComponents: Array.isArray(comp)
                  ? comp.some(one => one.hasChildComponents || one.type === 'component')
                  : comp.hasChildComponents || comp.type === 'component',
          }*/

          return elem;
        } // ignore function types for now


        const elem = {
          name: tagName,
          type: 'html',
          attributes: attrs,
          children: [],
          listeners: {},
          hasChildComponents: false
        };
        Object.entries(attrs || {}).forEach(([name, value]) => {
          if (name.startsWith('on') && name.toLowerCase() in window) {
            // HERE if value is useCiCallback call
            // we need to store returned cb and dependencies
            // and than if prebNode deps === current deps -> listeners[event] = prevListeners[event]
            elem.listeners[name.toLowerCase()] = value;
            delete elem.attributes[name];
          }
        });

        if (attrs?.debug) {
          console.warn('DEBUG: ', elem, attrs, JSON.stringify(children));
        }

        if (!children) return elem;

        for (const child of children) {
          if (Array.isArray(child)) {
            elem.children.push(...child.filter(one => one !== null && !(typeof one === 'undefined')).map(VirtualDOM.convertTextToTag));

            if (child.some(one => one && (one.hasChildComponents || one.type === 'component'))) {
              elem.hasChildComponents = true;
            }
          } else {
            if (child != null && !(typeof elem === 'undefined')) {
              elem.children.push(VirtualDOM.convertTextToTag(child));

              if (child?.hasChildComponents || child?.type === 'component') {
                elem.hasChildComponents = true;
              }
            }
          }
        }

        return elem;
      }

    }

    class ObjectUtils {
      static flattenObject(ob) {
        if (typeof ob !== 'object') return ob;
        var toReturn = {};

        for (var i in ob) {
          if (!ob.hasOwnProperty(i)) continue;

          if (typeof ob[i] == 'object' && ob[i] !== null) {
            var flatObject = flattenObject(ob[i]);

            for (var x in flatObject) {
              if (!flatObject.hasOwnProperty(x)) continue;
              toReturn[i + '.' + x] = flatObject[x];
            }
          } else {
            toReturn[i] = ob[i];
          }
        }

        return toReturn;
      }

      static setByPath(objRef, path, data) {
        const pathParts = path.split('.');
        let updatingPart = objRef;

        if (!pathParts.length) {
          objRef = data;
          return objRef;
        }

        for (let i = 0; i < pathParts.length - 1; i++) {
          if (updatingPart[pathParts[i]]) {
            updatingPart = updatingPart[pathParts[i]];
          } else {
            const nP = pathParts[i + 1];

            if (Number.isInteger(+nP)) {
              updatingPart[pathParts[i]] = [];
            } else {
              updatingPart[pathParts[i]] = {};
            }

            updatingPart = updatingPart[pathParts[i]];
          }
        }

        updatingPart[pathParts[pathParts.length - 1]] = data;
        return objRef;
      }

      static getByPath(objRef, path, def) {
        const pathParts = path.split('.');
        let updatingPart = objRef;

        if (!pathParts.length) {
          return objRef;
        }

        for (let i = 0; i < pathParts.length - 1; i++) {
          if (updatingPart[pathParts[i]]) {
            updatingPart = updatingPart[pathParts[i]];
          } else {
            return def;
          }
        }

        const val = updatingPart[pathParts[pathParts.length - 1]];
        return typeof val === 'undefined' ? def : val;
      }

    }

    class State {
      static state = {};

      static setState(path, value) {
        ObjectUtils.setByPath(State.state, path, value);
      }

      static queryState(path, def) {
        return ObjectUtils.getByPath(State.state, path, def);
      }

    }

    class Config {
      static configs;

      static setConfig(config) {
        Config.configs = {
          logPerformanceMonitor: true,
          logInterval: 10000,
          rerenderInterval: 50,
          debugVirtualDom: false,
          pauseRender: false,
          ...config
        };
      }

    }

    class Monitor {
      static metrics = {};

      static resetMetrics() {
        Monitor.metrics = {};
      }

      static addValue(key, value) {
        Monitor.metrics[key] = (Monitor.metrics[key] || 0) + value;
      }

      static initialize() {
        setInterval(() => {
          if (Config.configs.logPerformanceMonitor) {
            console.log(`monitor results over last ${Config.configs.logInterval}ms:`);
            Object.entries(Monitor.metrics).forEach(([key, value]) => {
              console.log(`metrics.${key}`, value);
            });
          }

          Monitor.resetMetrics();
        }, Config.configs.logInterval);
      }

    }

    class UpdateChecker {
      static shouldUpdateLazy(prev, current) {
        if (!prev && current) return true;
        if (!prev && !current) return false;
        if (typeof prev !== typeof current) return true;

        if (Array.isArray(prev) && Array.isArray(current)) {
          if (prev.length !== current.length) return true;

          for (let i = 0; i < prev.length; i++) {
            if (prev[i] !== current[i]) return true;
          }

          return false;
        }

        for (const key in prev) {
          if (!prev.hasOwnProperty(key)) {
            continue;
          }

          if (prev[key] !== current[key]) return true;
        }

        return false;
      }

      static defaultShouldUpdate(prev, current) {
        if (!prev && current || prev && !current) return true;
        if (!prev && !current) return false;
        if (prev === current) return false; // equals

        if (typeof prev !== typeof current) return true;
        if (typeof current !== 'object') return prev !== current;

        if (Array.isArray(prev) && Array.isArray(current)) {
          if (prev.length !== current.length) {
            return true;
          }

          if (prev.length === 0 && current.length === 0) {
            return false;
          }
        }

        if (Object.keys(prev).length !== Object.keys(current).length) return true;

        for (const key in prev) {
          if (!prev.hasOwnProperty(key)) {
            continue;
          }

          if (!(key in current)) {
            return true;
          }

          if (typeof prev[key] === 'object') {
            // console.log('defaultShouldUpdate', key, prev[key], current[key], prev[key] === current[key], prev === current);
            if (UpdateChecker.defaultShouldUpdate(prev[key], current[key])) {
              return true;
            }
          } else if (prev[key] !== current[key]) return true;
        }

        return false;
      }

      static checkAbortNode(DOMNode, prevDOMNode, parent) {
        if (typeof DOMNode !== 'object' && DOMNode !== prevDOMNode) {
          DOMNode.shouldUpdate = true;
          return true;
        }

        if (DOMNode.removedItem) {
          DOMNode.shouldUpdate = true;
          return true;
        }

        return false;
      }
      /**
       *
       * @param prevNode
       * @param currentNode
       * @param attributes
       *
       * TODO: this method takes too many resources
       */


      static checkListeners(prevNode, currentNode, attributes) {
        if (!prevNode?.listeners && !currentNode?.listeners) {
          return;
        }

        if (!Object.keys(prevNode?.listeners || {}).length && !Object.keys(currentNode?.listeners || {}).length) {
          return;
        }

        if (prevNode && !prevNode.listeners) {
          prevNode.listeners = {};
        }

        if (!currentNode.listeners) {
          currentNode.listeners = {};
        }

        if (Object.keys(prevNode?.listeners || {}).length === 0 && Object.keys(currentNode.listeners).length === 0) {
          currentNode.shouldUpdateListeners = false;
          return;
        }

        if (Object.keys(prevNode?.listeners || {}).length !== Object.keys(currentNode.listeners).length) {
          currentNode.shouldUpdateListeners = true;
        } // now set new listeners up to date with cached ones


        Object.entries(currentNode.listeners).forEach(([key, listener]) => {
          if (listener == null) {
            delete currentNode.listeners[key];
            return;
          }

          if (!prevNode?.listeners?.[key]) {
            if (typeof listener === 'function') {
              currentNode.listeners[key] = {
                currCb: listener,
                realCb: listener
              };
            } else if (listener) {
              currentNode.listeners[key] = {
                realCb: event => {
                  // console.log('triggered ', key, ' with params ', listener.deps, ' was setup from init');
                  listener.currCb(...(listener.deps || []), event);
                },
                currCb: listener.currCb,
                deps: listener.deps
              };
            } // console.log('UPDATING LISTENER CAUSE PREV LISTENER WAS NOT EXISTING');


            currentNode.listeners[key].prevCb = null;
            currentNode.listeners[key].prealCb = null;
            currentNode.listeners[key].shouldUpdateListener = true;
            currentNode.shouldUpdateListeners = true;
            return;
          }

          if (typeof prevNode.listeners[key] === 'function') {
            console.error('Found unprocessed handler ' + key + ' on node: ', prevNode.listeners[key]);
            console.error('Exit since this can cause memory leaks');
            throw new Error('Invalid DOM parsed: invalid handler');
          }

          if (typeof listener === 'function') {
            // just compare methods
            // console.log('comparing listeners: ', prevNode?.listeners, listener, prevNode?.listeners?.[key] === listener);
            currentNode.listeners[key] = {
              currCb: listener,
              realCb: listener,
              prevCb: prevNode.listeners[key].prevCb,
              prealCb: prevNode.listeners[key].prealCb,
              shouldUpdateListener: prevNode.listeners[key].currCb !== listener
            }; // console.log('chkListener: ', prevNode.listeners[key], listener, prevNode.listeners[key] !== listener);
            // console.log('prNode: ', prevNode);

            if (currentNode.listeners[key].shouldUpdateListener) {
              currentNode.listeners[key].prevCb = prevNode.listeners[key].currCb;
              currentNode.listeners[key].prealCb = prevNode.listeners[key].prealCb;
              currentNode.shouldUpdateListeners = true;
            }

            return;
          }

          if (typeof listener === 'object' && listener.currCb) {
            // this eats a lot of time to check per deep nesting
            // so, mb worth to implement lazy component that does
            // check on specific attributes
            const depsChanged = UpdateChecker.defaultShouldUpdate(prevNode.listeners[key].deps, listener.deps);

            if (!depsChanged) {
              currentNode.listeners[key].prevCb = prevNode.listeners[key].prevCb;
              currentNode.listeners[key].prealCb = prevNode.listeners[key].prealCb;
              currentNode.listeners[key].currCb = prevNode.listeners[key].currCb;
              currentNode.listeners[key].realCb = prevNode.listeners[key].realCb;
              /*if(currentNode.attributes.monitorId) {
                  console.log(`listeners:NC[${currentNode.attributes.monitorId}]: `, currentNode.listeners[key], currentNode.listeners[key].realCb === prevNode.listeners[key].realCb);
              }*/

              return;
            } else {
              currentNode.listeners[key].prevCb = prevNode.listeners[key].currCb;
              currentNode.listeners[key].prealCb = prevNode.listeners[key].realCb;

              currentNode.listeners[key].realCb = event => {
                console.log('triggered ', key, ' with params ', listener.deps, ' was setup from prop changed');
                listener.currCb(...(listener.deps || []), event);
              };

              if (currentNode.attributes?.monitorId) {
                console.log(`listeners[${currentNode.attributes?.monitorId}]: `, currentNode.listeners[key], currentNode.listeners[key].realCb === prevNode.listeners[key].realCb, Object.assign({}, prevNode.listeners[key].deps), Object.assign({}, listener.deps));
              }
            }
          }

          console.log('UPDATING LISTENER CAUSE NEVER RETURNED BEFORE');
          currentNode.listeners[key].shouldUpdateListener = true;
          currentNode.shouldUpdateListeners = true;
        }); // iterate over missing keys

        Object.entries(prevNode?.listeners || {}).filter(([key]) => !currentNode.listeners[key]).forEach(([key, listener]) => {
          if (!listener || !listener.currCb) {
            // prev element had removed listener only - abort early
            return;
          }

          currentNode.listeners[key] = {
            currCb: null,
            realCb: null,
            prevCb: typeof listener === "function" ? listener : listener.prevCb,
            shouldUpdateListener: true
          };
          currentNode.shouldUpdateListeners = true;
        });
      }

      static firstNonComponentType(node) {
        while (node && node.type === 'component') {
          node = node.children[0];
        }

        return node?.ref;
      }

      static checkShouldUpdate(DOMNode, prevDOMNode, parent, path = 'root') {
        DOMNode.shouldUpdate = false;

        if (DOMNode.type === 'component') {
          DOMNode.componentId = `${path}.${DOMNode.name}`;

          if (parent) {
            parent.hasChildComponents = true;
          }
        }
        /*if(DOMNode.name === 'BuildingsComponent') {
            console.log('DOMNode: ', DOMNode, JSON.stringify(DOMNode, ' ', 2));
            console.log('prevDOMNode: ', prevDOMNode);
            console.log('parent: ', parent);
        }*/


        if (UpdateChecker.checkAbortNode(DOMNode, prevDOMNode, parent)) {
          return true;
        }
        /*if(['html', 'text'].includes(DOMNode.type) && prevDOMNode.type === 'component') {
            DOMNode.isReplaceComponent = true;
        }*/


        if (parent && parent.isReplaceDOM) {
          DOMNode.isReplaceDOM = true;
        }

        if (prevDOMNode && DOMNode.type !== prevDOMNode.type
        /* && [DOMNode.type, prevDOMNode.type].includes('component')*/
        || parent?.isReplaceComponent) {
          DOMNode.isReplaceComponent = true;

          if (prevDOMNode && DOMNode.type !== prevDOMNode.type) {
            DOMNode.isReplaceOrig = true;
            DOMNode.prevType = prevDOMNode.type;

            if (DOMNode.type === 'component' && parent) {
              parent.isReplaceDOM = true;
            }
          }

          if (prevDOMNode && !DOMNode.children.length && prevDOMNode.type === 'component') {
            //    save up first DOMRef in DOMNode.truncatedHTMLRef
            DOMNode.truncatedHTMLRef = UpdateChecker.firstNonComponentType(prevDOMNode.children[0]);
            DOMNode.isReplaceDOM = true; // because we'll be unable to map further properly
          }

          DOMNode.shouldUpdate = true;

          if (parent) {
            parent.shouldUpdate = true;
          }
        }

        if (prevDOMNode && prevDOMNode.ref && !DOMNode.ref) {
          DOMNode.ref = prevDOMNode.ref;
        }

        if (!prevDOMNode) {
          DOMNode.shouldUpdate = true;
        } else if (!DOMNode.ref && ['html', 'text'].includes(DOMNode.type)) {
          DOMNode.shouldUpdate = true;
        } else if (prevDOMNode && DOMNode.name !== prevDOMNode.name && ['html', 'text'].includes(DOMNode.type)) {
          DOMNode.shouldUpdate = true;
        }

        if (!DOMNode.shouldUpdate) {
          if (DOMNode.isLazyComp) {
            DOMNode.shouldUpdate = UpdateChecker.shouldUpdateLazy(prevDOMNode.attributes, DOMNode.attributes);
          } else {
            DOMNode.shouldUpdate = UpdateChecker.defaultShouldUpdate(prevDOMNode.attributes, DOMNode.attributes);
          }
        }
        /*if(DOMNode.name === 'BuildingsComponent') {
            console.log('DOMNode: ', DOMNode?.attributes);
            console.log('prevDOMNode: ', prevDOMNode?.attributes);
            console.log('isEq: ', UpdateChecker.defaultShouldUpdate(prevDOMNode.attributes, DOMNode.attributes));
        }*/


        const checkListeners = DOMNode?.listeners || prevDOMNode?.listeners; // thid part takes too much

        if (checkListeners) {
          UpdateChecker.checkListeners(prevDOMNode, DOMNode, DOMNode.attributes);
        }

        if (DOMNode.children) {
          if (DOMNode.children.length !== prevDOMNode?.children?.length) {
            DOMNode.shouldUpdate = true;
          }

          if (prevDOMNode?.children?.length) {
            prevDOMNode.children = prevDOMNode.children.filter(one => !one.removedItem);
          }

          if (prevDOMNode?.children?.length > DOMNode.children.length) {
            const removedCount = prevDOMNode?.children?.length - DOMNode.children.length;
            /*console.log('prevDOMNode.children: ',
                JSON.stringify(prevDOMNode.children, ' ', 2),
                JSON.stringify(DOMNode.children, ' ', 2), removedCount);*/

            Array.from({
              length: removedCount
            }).forEach((item, index) => {
              // console.log('index: ', index, DOMNode.children, prevDOMNode.children);
              DOMNode.children.push({
                name: prevDOMNode.children[DOMNode.children.length].name,
                type: prevDOMNode.children[DOMNode.children.length].type,
                ref: prevDOMNode.children[DOMNode.children.length].ref,
                children: prevDOMNode.children[DOMNode.children.length].children,
                removedItem: true,
                removedIndex: -1
              });
            }); //console.log('newDOMS: ', JSON.stringify(DOMNode, ' ', 2));
          }

          DOMNode.children.forEach((node, index) => {
            const newPath = DOMNode.type === 'component' ? `${path}.${DOMNode.name}.${index}` : path;
            UpdateChecker.checkShouldUpdate(node, prevDOMNode?.children?.[index], DOMNode, newPath);
          });

          if (DOMNode.hasChildComponents && parent) {
            parent.hasChildComponents = true;
          }
        } // process hooks
        // on update


        if (DOMNode.shouldUpdate) {
          if (DOMNode.onUpdate) {
            DOMNode.onUpdate(DOMNode.attributes, prevDOMNode?.attributes);
          }
        } // onMount / unMount
        // unMount should be worked and tested additionally


        if (DOMNode.isReplaceComponent || DOMNode.tagName !== prevDOMNode?.tagName) {
          if (DOMNode.type === 'component' && DOMNode.onMount) {
            DOMNode.onMount(DOMNode.attributes);
          }

          if (prevDOMNode && prevDOMNode.type === 'component' && prevDOMNode.onUnmount) {
            prevDOMNode.onUnmount(prevDOMNode, DOMNode);
          }
        }
      }

    }

    class RealDom {
      static monitors = {};
      static isReRendering = false;
      static preventRender = false;

      static renderHTML(DOMNode, parent, parentDOM) {
        // console.log('rendering', DOMNode, parent);
        if (typeof DOMNode !== 'object') {
          return DOMNode;
        }

        if (DOMNode.shouldUpdate) {
          if (['html', 'text'].includes(DOMNode.type)) {
            if (!parent) {
              console.warn('NO PARENT: ', DOMNode, { ...DOMNode
              });
            }

            if (DOMNode.removedItem) {
              // console.log('deleting', DOMNode, parentDOM);
              if (DOMNode.ref) {
                DOMNode.ref.remove();
                delete DOMNode.ref;
              }

              return;
            }

            let oldRef = DOMNode.ref;

            if (DOMNode.isReplaceComponent) {
              // console.log('isReplaceComponent: ', {...DOMNode}, {...parentDOM});
              // replace text to html cause problems here
              // [span, text] => [component, div] = issue - RESOLVED
              // [component, component, html] => [html, text] = issue, cause link to first html in nest wont persist
              // to resolve: if !DOMNode.children && prevDomNode.type === component
              //    save up first DOMRef in DOMNode.truncatedHTMLRef
              //    DOMNode.truncatedHTMLRef = firstNonComponentType(prevDomNode.children[0])
              if (DOMNode.prevType === 'component') {
                if (parent && DOMNode.isReplaceOrig) {
                  if (DOMNode.children.length < 1) // it should be the case for components always
                    {
                      console.error(`Error: Invalid component replacement`, DOMNode, DOMNode.children.length);
                    } else {
                    // console.log('DCH: ', {...DOMNode.children[0]})
                    let nst = DOMNode;

                    while (nst && nst.prevType === 'component' && !nst.truncatedHTMLRef) {
                      nst = nst.children[0];
                    }

                    if (nst) {
                      if (nst.truncatedHTMLRef) {
                        DOMNode.isReplaceDOM = true;
                      }

                      let rf = nst.truncatedHTMLRef ? nst.truncatedHTMLRef : nst.ref; // console.log('DCH2: ', {...nst}, nst.ref?.parentNode, nst.truncatedHTMLRef?.parentNode, parent);

                      if (rf && rf.parentNode === parent) {
                        oldRef = rf;
                      } else {
                        if (DOMNode.ref) {
                          DOMNode.ref.remove();
                          delete DOMNode.ref;
                        }
                      }
                    }
                  }
                }
              } else {
                if (DOMNode.ref) {
                  DOMNode.ref.remove();
                  delete DOMNode.ref;
                  oldRef.remove();
                  oldRef = null;
                } // console.log('afterDeleting: ', DOMNode.ref, oldRef);

              }
            }

            if (DOMNode.type === 'html') {
              DOMNode.ref = Object.assign(document.createElement(DOMNode.name), DOMNode.attributes);

              if (DOMNode.name === 'input' && DOMNode.attributes?.value) {
                DOMNode.ref.setAttribute('value', DOMNode.attributes?.value);
              }
            } else {
              DOMNode.ref = document.createTextNode(DOMNode.name);
            }

            Object.entries(DOMNode.listeners || {}).forEach(([key, value]) => {
              if (oldRef) {
                oldRef.removeEventListener(key.toLowerCase().substr(2), value.realCb);
              }

              DOMNode.ref.addEventListener(key.toLowerCase().substr(2), value.realCb);
            });
            /*if(DOMNode.attributes?.className === 'toggle-collapsed') {
                console.log('collapsedBlock[realDOM]: ', DOMNode, {...DOMNode}, oldRef, parentDOM);
            }*/

            /* if(parentDOM?.attributes?.className === 'toggle-collapsed') {
                 console.log('collapsedBlock[realDOM].child: ', DOMNode, {...DOMNode}, oldRef, parent, parentDOM);
             }*/

            /*if(parentDOM?.attributes?.id === 'zone-level') {
                console.log('mixedMessed: ', DOMNode, oldRef, parent, Array.from(parent?.children).map(one => one ? ({
                    tag: one.tagName,
                    className: one.classList,
                }) : one));
            }*/
            // console.log('domNodeUpdate: ', DOMNode, oldRef, parent);

            if (DOMNode.ref) {
              try {
                if (!oldRef) {
                  parent.append(DOMNode.ref);
                } else {
                  if (oldRef.childNodes.length && DOMNode.type === 'html' && !DOMNode.isReplaceDOM) {
                    DOMNode.ref.append(...oldRef.childNodes);
                  }

                  parent.replaceChild(DOMNode.ref, oldRef);
                }
              } catch (e) {
                console.error(e, oldRef);
                console.error('parentDOM', parent);
                console.error('oldRefParent: ', oldRef.parentNode);
                console.error('args: ', DOMNode, parent, parentDOM);
                parent.append(DOMNode.ref);
              }
            }
            /*if(DOMNode.attributes?.id === 'zone-level') {
                console.log('mixedUpChildren: ', DOMNode.children, Array.from(DOMNode.ref?.children).map(one => one ? ({
                    tag: one.tagName,
                    className: one.classList,
                }) : one), DOMNode, oldRef);
            }*/


            if (DOMNode.children) {
              if (DOMNode.isReplaceDOM) {
                // console.log('Force to replace DOM Nodes in ', DOMNode);
                DOMNode.children.map(one => {
                  one.isReplaceDOM = true;

                  if (!one.shouldUpdate) {
                    console.warn('WARN: elen not uodating during replace. Force it', one);
                    one.shouldUpdate = true;
                  }

                  if (one.ref) {
                    one.ref.remove();
                    delete one.ref;
                  }
                });
              }

              DOMNode.children.map(one => RealDom.renderHTML(one, DOMNode.ref, DOMNode)); // RealDom.handleDOMNodeEvents(DOMNode);
            }
            /*if(DOMNode.attributes?.className === 'toggle-collapsed') {
                console.log('collapsedBlock[iterEnd]: ', {...DOMNode}, parentDOM);
            }*/

          }

          if (DOMNode.type === 'component') {
            if (DOMNode.ref) {
              // instead of simply deleting this we should replace with children
              DOMNode.ref.remove();
            }

            if (DOMNode.children) {
              if (DOMNode.removedItem) {
                DOMNode.children.forEach((one, index) => {
                  one.removedItem = true;
                  one.removedIndex = index;
                  one.shouldUpdate = true;
                });
              } // console.log('removing sub-items: ', DOMNode.children);


              const refs = DOMNode.children.map(one => RealDom.renderHTML(one, parent, parentDOM));
              return refs;
            }
          }
        } else {
          if (DOMNode.children) {
            if (DOMNode.type === 'component' && !DOMNode.hasChildComponents) {
              // meaning everything is static inside
              // console.log('non-update: ', DOMNode);
              return DOMNode.children.map(one => one.ref);
            } else {
              DOMNode.children.map(one => RealDom.renderHTML(one, ['html', 'text'].includes(DOMNode.type) ? DOMNode.ref : parent, ['html', 'text'].includes(DOMNode.type) ? DOMNode : parentDOM));
            }
          }
        }

        if (DOMNode.shouldUpdateListeners) {
          if (DOMNode.ref) {
            // console.log('update listeners', DOMNode.ref);
            const monId = DOMNode.attributes?.['monitorId'];
            Object.entries(DOMNode.listeners).forEach(([key, value]) => {
              if (value.prealCb !== value.realCb) ;

              if (value.shouldUpdateListener) {
                const ev = key.toLowerCase().substr(2);
                console.log('update listeners', DOMNode.ref, ev, value, monId);

                if (value.prealCb) {
                  if (ev === 'click' && monId) {
                    if (!RealDom.monitors[monId] || !RealDom.monitors[monId].includes(value.prealCb)) {
                      console.error(`[${monId}]Value `, value.prealCb, ' not exists in ', RealDom.monitors[monId]);
                      console.error('FULL values stored: ', value);
                    } else {
                      console.warn(`[${monId}]Value found! `, value.prealCb, RealDom.monitors[monId]);
                      console.warn('Full values: ', value);
                    }
                  }

                  DOMNode.ref.removeEventListener(ev, value.prealCb, false);
                }

                if (value.realCb) {
                  DOMNode.ref.addEventListener(ev, value.realCb, false);
                }

                if (ev === 'click' && monId) {
                  if (!RealDom.monitors[monId]) {
                    RealDom.monitors[monId] = [];
                  }

                  RealDom.monitors[monId].push(value.realCb);
                }
              }
            });
          }
        }

        return DOMNode.ref;
      }

      static renderDOM(func, id) {
        //const start = performance.now();
        if (RealDom.isReRendering) {
          console.warn('Skip re-render UI');
        }

        if (RealDom.preventRender) {
          return;
        }

        RealDom.isReRendering = true;
        const newDom = func(); // console.log('newDom: ', newDom);
        //const runned = performance.now();
        // console.log('compare: ', JSON.stringify(VirtualDOM.DOMNodes, ' ', 1), JSON.stringify(newDom, ' ', 1));

        UpdateChecker.checkShouldUpdate(newDom, VirtualDOM.DOMNodes);
        VirtualDOM.DOMNodes = newDom;

        if (Config.configs.debugVirtualDom) {
          console.log('afterCheck: ', newDom
          /*JSON.stringify(newDom, ' ', 2)*/
          );
        } // const rendTime = performance.now();
        // render html takes too much time
        // so, need:
        // - first, add monitor statistics per component
        // - double check if properly working with DOM


        RealDom.renderHTML(VirtualDOM.DOMNodes, document.getElementById(id));
        RealDom.isReRendering = false;

        if (Config.configs.pauseRender) {
          Config.configs.pauseRender--;
        }

        RealDom.preventRender = Config.configs.pauseRender === 0; // console.log('afterRender: ', JSON.stringify(VirtualDOM.DOMNodes, ' ', 1));
        //const end = performance.now();

        /*Monitor.addValue('parseTime', runned - start);
        Monitor.addValue('checkDOMUpdates', rendTime - runned);
        Monitor.addValue('rendering', end - rendTime);
        Monitor.addValue('idling', Config.configs.rerenderInterval - end + start);*/
        // console.log('html', html, runned - start, rendTime - runned, end - rendTime, end - start);
      }

    }

    function initColibriApp(id, func, config) {
      console.log('initializing: ', id);

      window.onload = () => {
        Config.setConfig(config);
        Monitor.initialize();
        RealDom.renderDOM(func, id); // VirtualDOM.DOMNodes = func();
        // console.log('initing', func, func());
        // window.document.getElementById(id).replaceWith(renderDOM(DOM, func));
        // for now

        setInterval(() => RealDom.renderDOM(func, id), Config.configs.rerenderInterval); // setTimeout(() => renderDOM(func), 2000);

        console.log('comps: ', VirtualDOM.DOMNodes);
      };
    }
    const useCiCallback = (cb, deps) => ({
      currCb: cb,
      deps,
      isCachable: true
    });
    const whenMount = cb => {
      if (!VirtualDOM.currentComponent) {
        throw new Error('Hooks can be called only within component');
      }

      VirtualDOM.currentComponent.onMount = cb;
    };
    const whenUpdate = cb => {
      if (!VirtualDOM.currentComponent) {
        throw new Error('Hooks can be called only within component');
      }

      VirtualDOM.currentComponent.onUpdate = cb;
    };

    class ColibriWorker {
      static worker;
      static handlers = {};

      static setup(path) {
        ColibriWorker.worker = new Worker(path || './worker.js');
      }

      static on(type, cb) {
        ColibriWorker.handlers[type] = cb;
      }

      static sendToClient(type, payload) {
        /*console.log('[worker] send to client', {
            type,
            payload,
        });*/
        postMessage({
          type,
          payload
        });
      }

    }

    class ColibriClient {
      static handlers = {};

      static on(type, cb) {
        ColibriClient.handlers[type] = cb;
      }

      static sendToWorker(type, payload) {
        /*console.log('[client] send to worker',{
            type,
            payload,
        });*/
        ColibriWorker.worker.postMessage({
          type,
          payload
        });
      }

      static listen() {
        ColibriWorker.worker.onmessage = e => {
          // console.log('[client] recieved from worker: ', e);
          if (e.data?.type && ColibriClient.handlers[e.data?.type]) {
            ColibriClient.handlers[e.data?.type](e.data?.payload);
          }
        };
      }

    }

    const HTTP_PATH = '';

    const switchTab = tabId => {
      console.log('set tab: ', tabId);
      State.setState('ui.navigation.page', tabId);
    };
    const Navigation = ({
      selectedTab,
      unlocks
    }) => VirtualDOM.createVirtualElement("div", {
      className: 'menu-wrap'
    }, VirtualDOM.createVirtualElement("div", {
      className: 'menu'
    }, VirtualDOM.createVirtualElement("p", {
      className: `menu-item ${selectedTab === 'jobs' ? 'selected' : ''}`,
      monitorId: 'jobs',
      onClick: useCiCallback(() => {
        console.log('clicked jobs');
        switchTab('jobs');
      })
    }, "Actions"), VirtualDOM.createVirtualElement("p", {
      className: `menu-item ${selectedTab === 'shop' ? 'selected' : ''}`,
      monitorId: 'shop',
      onClick: useCiCallback(() => {
        console.log('clicked shop');
        switchTab('shop');
      })
    }, "Shop"), VirtualDOM.createVirtualElement("p", {
      className: `menu-item ${selectedTab === 'learning' ? 'selected' : ''}`,
      monitorId: 'learning',
      onClick: useCiCallback(() => {
        console.log('clicked learning');
        switchTab('learning');
      })
    }, "Learning"), unlocks.creatures ? VirtualDOM.createVirtualElement("p", {
      className: `menu-item ${selectedTab === 'creatures' ? 'selected' : ''}`,
      monitorId: 'creatures',
      onClick: useCiCallback(() => {
        console.log('clicked creatures');
        switchTab('creatures');
      })
    }, "Creatures") : VirtualDOM.createVirtualElement("p", {
      className: 'locked'
    }, "Locked"), unlocks.banners ? VirtualDOM.createVirtualElement("p", {
      className: `menu-item ${selectedTab === 'banners' ? 'selected' : ''}`,
      monitorId: 'banners',
      onClick: useCiCallback(() => {
        console.log('clicked banners');
        switchTab('banners');
      })
    }, "Banners") : VirtualDOM.createVirtualElement("p", {
      className: 'locked'
    }, "Locked"), unlocks.research ? VirtualDOM.createVirtualElement("p", {
      className: `menu-item ${selectedTab === 'research' ? 'selected' : ''}`,
      monitorId: 'research',
      onClick: useCiCallback(() => {
        console.log('clicked research');
        switchTab('research');
      })
    }, "Research") : VirtualDOM.createVirtualElement("p", {
      className: 'locked'
    }, "Locked"), unlocks.battle ? VirtualDOM.createVirtualElement("p", {
      className: `menu-item ${selectedTab === 'battle' ? 'selected' : ''}`,
      monitorId: 'battle',
      onClick: useCiCallback(() => {
        console.log('clicked battle');
        switchTab('battle');
      })
    }, "Battle") : VirtualDOM.createVirtualElement("p", {
      className: 'locked'
    }, "Locked"), unlocks.heirlooms ? VirtualDOM.createVirtualElement("p", {
      className: `menu-item ${selectedTab === 'heirlooms' ? 'selected' : ''}`,
      monitorId: 'heirlooms',
      onClick: useCiCallback(() => {
        console.log('clicked heirlooms');
        switchTab('heirlooms');
      })
    }, "Heirlooms") : VirtualDOM.createVirtualElement("p", {
      className: 'locked'
    }, "Locked"), unlocks.building ? VirtualDOM.createVirtualElement("p", {
      className: `menu-item ${selectedTab === 'building' ? 'selected' : ''}`,
      monitorId: 'building',
      onClick: useCiCallback(() => {
        console.log('clicked building');
        switchTab('building');
      })
    }, "Building") : VirtualDOM.createVirtualElement("p", {
      className: 'locked'
    }, "Locked"), unlocks.auras ? VirtualDOM.createVirtualElement("p", {
      className: `menu-item ${selectedTab === 'auras' ? 'selected' : ''}`,
      monitorId: 'auras',
      onClick: useCiCallback(() => {
        console.log('clicked auras');
        switchTab('auras');
      })
    }, "Auras") : VirtualDOM.createVirtualElement("p", {
      className: 'locked'
    }, "Locked")));
    const TopMenu = ({
      selectedTab
    }) => VirtualDOM.createVirtualElement("div", {
      className: 'menu'
    }, VirtualDOM.createVirtualElement("img", {
      className: `menu-icon ${selectedTab === 'story' ? 'selected' : ''}`,
      src: `${HTTP_PATH}static/icons/ui/story.png`,
      onClick: useCiCallback(() => switchTab('story'))
    }), VirtualDOM.createVirtualElement("img", {
      className: `menu-icon ${selectedTab === 'settings' ? 'selected' : ''}`,
      src: `${HTTP_PATH}static/icons/ui/settings.png`,
      onClick: useCiCallback(() => switchTab('settings'))
    }));
    const Header = () => {
      const tabId = State.queryState('ui.navigation.page', 'jobs');
      const resourcesUnlocked = State.queryState('game.resources', []).filter(one => one.isUnlocked).map(one => one.id);
      const general = State.queryState('game.general', {});
      const unlocks = {
        creatures: resourcesUnlocked.includes('souls'),
        banners: general.bannersUnlocked,
        research: general.researchUnlocked,
        battle: general.battleUnlocked,
        building: general.buildingUnlocked,
        heirlooms: general.heirloomsUnlocked,
        auras: general.aurasUnlocked
      };
      return VirtualDOM.createVirtualElement("div", {
        className: 'header'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'header-flex'
      }, VirtualDOM.createVirtualElement("h1", null, "Idlemancery"), VirtualDOM.createVirtualElement(TopMenu, {
        selectedTab: tabId
      })), VirtualDOM.createVirtualElement(Navigation, {
        selectedTab: tabId,
        unlocks: unlocks
      }));
    };

    function styleInject(css, ref) {
      if (ref === void 0) ref = {};
      var insertAt = ref.insertAt;

      if (!css || typeof document === 'undefined') {
        return;
      }

      var head = document.head || document.getElementsByTagName('head')[0];
      var style = document.createElement('style');
      style.type = 'text/css';

      if (insertAt === 'top') {
        if (head.firstChild) {
          head.insertBefore(style, head.firstChild);
        } else {
          head.appendChild(style);
        }
      } else {
        head.appendChild(style);
      }

      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
    }

    var css_248z$g = ".footer {\r\n    position: fixed;\r\n    height: 40px;\r\n    background: #030304;\r\n    border-top: 1px solid #333;\r\n    padding: 5px;\r\n    bottom: 0;\r\n    width: 100%;\r\n}\r\n.menu-wrap {\r\n    width: 100%;\r\n    background: #000;\r\n    padding-left: 20px;\r\n}\r\n\r\n.menu {\r\n    display: flex;\r\n}\r\n\r\n.menu-item {\r\n    padding: 10px 12px;\r\n    cursor: pointer;\r\n    margin: 0;\r\n}\r\n\r\n.menu-item.selected,\r\n.menu-item:hover {\r\n    background: #111119;\r\n    font-weight: bold;\r\n}\r\n\r\n.header {\r\n    position: fixed;\r\n    top: 0px;\r\n    background: #121520;\r\n    width: 100%;\r\n    z-index: 2;\r\n}\r\n\r\n.locked {\r\n    color: #aaa;\r\n    padding: 10px 12px;\r\n    margin: 0;\r\n}\r\n\r\n.header-flex {\r\n    display: flex;\r\n    justify-content: space-between;\r\n    align-items: center;\r\n}\r\n\r\n.menu {\r\n    margin-right: 15px;\r\n}\r\n\r\n.menu img {\r\n    margin: 5px;\r\n    width: 32px;\r\n    height: 32px;\r\n    object-fit: contain;\r\n    cursor: pointer;\r\n    opacity: 0.75;\r\n}\r\n\r\n.menu img.selected {\r\n    opacity: 1;\r\n}";
    styleInject(css_248z$g);

    const ModalUI = ({
      modalId,
      className,
      title,
      actions,
      children,
      isHideClose
    }) => VirtualDOM.createVirtualElement("div", {
      className: 'modal-wrap'
    }, VirtualDOM.createVirtualElement("div", {
      className: `modal ${className}`
    }, VirtualDOM.createVirtualElement("div", {
      className: 'modal-header flex'
    }, VirtualDOM.createVirtualElement("h2", null, title), !isHideClose ? VirtualDOM.createVirtualElement("span", {
      className: 'close',
      onClick: useCiCallback(id => State.setState(`ui.modal.${id}`, false), [modalId])
    }, "X") : null), VirtualDOM.createVirtualElement("div", {
      className: 'modal-body'
    }, children), actions ? VirtualDOM.createVirtualElement("div", {
      className: 'modal-footer'
    }, actions.map(one => VirtualDOM.createVirtualElement("button", {
      className: one.className || 'main-action',
      onClick: one.cb
    }, one.title))) : null));
    const Modal = ({
      modalId,
      className,
      title,
      actions,
      isHideClose
    }, children) => {
      const isOpened = State.queryState(`ui.modal.${modalId}`);
      if (!isOpened) return null;
      return VirtualDOM.createVirtualElement(ModalUI, {
        modalId: modalId,
        className: className,
        title: title,
        actions: actions,
        children: children,
        isHideClose: isHideClose
      });
    };
    const showModal = id => State.setState(`ui.modal.${id}`, true);
    const closeModal = id => State.setState(`ui.modal.${id}`, false);
    const isModalOpened = id => State.queryState(`ui.modal.${id}`, false);

    const fmtVal = val => {
      if (val == null) return '0';
      if (!val) return '0';
      const sign = Math.sign(val);
      const abs = Math.abs(val);
      const orders = Math.log10(abs);
      let suffix = '';
      const suffixId = Math.floor(orders / 3);
      const mpart = (abs / Math.pow(1000, suffixId)).toFixed(2);

      if (orders < 0) {
        if (orders >= -2) {
          return `${sign < 0 ? '-' : ''}${abs.toFixed(2)}`;
        }

        const suffixId = Math.floor(orders / 3);

        switch (suffixId) {
          case -1:
            suffix = 'm';
            break;

          case -2:
            suffix = 'mc';
            break;

          case -3:
            suffix = 'n';
            break;
        }

        return `${sign < 0 ? '-' : ''}${mpart}${suffix}`;
      }

      switch (suffixId) {
        case 1:
          suffix = 'K';
          break;

        case 2:
          suffix = 'M';
          break;

        case 3:
          suffix = 'B';
          break;

        case 4:
          suffix = 'T';
          break;

        case 5:
          suffix = 'Qa';
          break;

        case 6:
          suffix = 'Qi';
          break;

        case 7:
          suffix = 'Sx';
          break;

        case 8:
          suffix = 'Sp';
          break;

        case 9:
          suffix = 'Oc';
          break;

        case 10:
          suffix = 'No';
          break;

        case 11:
          suffix = 'Dc';
          break;

        case 12:
          suffix = 'UDc';
          break;

        case 13:
          suffix = 'DDc';
          break;

        case 14:
          suffix = 'TDc';
          break;

        case 15:
          suffix = 'QaDc';
          break;

        case 16:
          suffix = 'QiDc';
          break;

        case 17:
          suffix = 'SxDc';
          break;

        case 18:
          suffix = 'SpDc';
          break;

        case 19:
          suffix = 'OcDc';
          break;

        case 20:
          suffix = 'NDc';
          break;

        case 21:
          suffix = 'Vi';
          break;
      }

      return `${sign < 0 ? '-' : ''}${mpart}${suffix}`;
    };
    function secondsToHms(d) {
      if (!d) return '00:00:00';
      d = Number(d);
      const h = Math.floor(d / 3600);
      const m = Math.floor(d % 3600 / 60);
      const s = Math.floor(d % 3600 % 60);
      const hDisplay = h > 9 ? `${h}:` : `0${h}:`;
      const mDisplay = m > 9 ? `${m}:` : `0${m}:`;
      const sDisplay = s > 9 ? `${s}` : `0${s}`;
      return hDisplay + mDisplay + sDisplay;
    }

    const showVersion = () => showModal('version');

    const showAbout = () => showModal('about');

    const FooterUI = ({
      general
    }) => VirtualDOM.createVirtualElement("div", {
      className: 'footer flex'
    }, VirtualDOM.createVirtualElement("div", {
      className: 'flex'
    }, VirtualDOM.createVirtualElement("p", {
      className: 'popup-link',
      onClick: showVersion
    }, "v0.1.8"), VirtualDOM.createVirtualElement("p", {
      className: 'popup-link',
      onClick: showAbout
    }, "About"), VirtualDOM.createVirtualElement("p", null, VirtualDOM.createVirtualElement("a", {
      className: 'popup-link',
      href: 'https://discord.gg/TRRvKf4ZTG',
      target: '_blank'
    }, "Join Discord")), VirtualDOM.createVirtualElement("p", null, VirtualDOM.createVirtualElement("a", {
      className: 'popup-link',
      href: 'https://patreon.com/user?u=83421544',
      target: '_blank'
    }, "Support on Patreon"))), VirtualDOM.createVirtualElement("p", null, "Time spent: ", secondsToHms(general?.timeSpent)));
    const Footer = () => {
      const general = State.queryState('game.general', {});
      return VirtualDOM.createVirtualElement(FooterUI, {
        general: general
      });
    };

    var css_248z$f = ".sidebar {\r\n    margin-right: 15px;\r\n    background: #000000;\r\n    padding: 15px;\r\n    width: 300px;\r\n    flex-shrink: 0;\r\n    min-height: calc(100vh - 180px);\r\n    position: relative;\r\n}\r\n\r\n.sidebar.collapsed {\r\n    width: 110px;\r\n}\r\n\r\n.sidebar .inner-sidebar {\r\n    position: fixed;\r\n    width: 275px;\r\n}\r\n\r\n.sidebar.collapsed .inner-sidebar {\r\n    position: fixed;\r\n    width: 80px;\r\n}\r\n\r\n.sidebar .toggle-collapsed {\r\n    color: #aaa;\r\n    background: #411149;\r\n    border-radius: 25%;\r\n    width: 32px;\r\n    height: 32px;\r\n    position: absolute;\r\n    top: -8px;\r\n    right: -32px;\r\n    font-size: 42px;\r\n    text-align: center;\r\n    line-height: 24px;\r\n    cursor: pointer;\r\n}\r\n\r\n.sidebar .relative-wrap {\r\n    position: relative;\r\n}\r\n\r\n.sidebar .toggle-collapsed:hover {\r\n    background: #613169;\r\n}\r\n\r\n.sidebar .resourceName {\r\n    width: 80px;\r\n    display: inline-block;\r\n}\r\n\r\n.resource-line {\r\n    display: flex;\r\n    margin-bottom: 10px;\r\n}\r\n\r\n.resource-line .income {\r\n    font-size: 12px;\r\n    margin-left: 5px;\r\n}\r\n\r\n.resource-line .income.positive {\r\n    color: #53a862;\r\n}\r\n\r\n.resource-line .income.negative {\r\n    color: #ad2121;\r\n}\r\n\r\n.bonus {\r\n    font-size: 12px;\r\n    color: #aacaaa;\r\n}";
    styleInject(css_248z$f);

    const ResourceIcon = ({
      id
    }) => VirtualDOM.createVirtualElement("span", {
      className: 'resource-icon-wrap'
    }, VirtualDOM.createVirtualElement("img", {
      src: `${HTTP_PATH}static/icons/resources/${id}.png`
    }));
    const ResourcesListUI = ({
      data,
      resources,
      isSkipIcon = false,
      isSkipName = true
    }) => VirtualDOM.createVirtualElement("div", {
      className: 'resourceList'
    }, Object.entries(data?.resources || data || {}).map(([key, value]) => {
      const rsf = (resources || []).find(one => one.id === key);
      if (!rsf) return;
      return VirtualDOM.createVirtualElement("p", {
        className: 'resource-item'
      }, !isSkipIcon ? VirtualDOM.createVirtualElement(ResourceIcon, {
        id: key
      }) : null, !isSkipName ? rsf.name : null, '  ', value.cost ? VirtualDOM.createVirtualElement("span", {
        className: !value.isAvailable ? 'missing' : 'enough'
      }, fmtVal(value.cost)) : fmtVal(value));
    }));
    const ResourcesList = ({
      data,
      isSkipIcon
    }) => {
      const resources = State.queryState('game.resources', []).map(({
        id,
        name
      }) => ({
        id,
        name
      }));
      return VirtualDOM.createVirtualElement(ResourcesListUI, {
        data: data,
        resources: resources,
        isSkipIcon: isSkipIcon
      });
    };

    function _extends() {
      _extends = Object.assign ? Object.assign.bind() : function (target) {
        for (var i = 1; i < arguments.length; i++) {
          var source = arguments[i];

          for (var key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
              target[key] = source[key];
            }
          }
        }

        return target;
      };
      return _extends.apply(this, arguments);
    }

    const toggleExpanded = expanded => {
      State.setState('game.ui.sidebarExpanded', expanded);
    };

    const switchSetting$2 = (path, value) => {
      console.log('changeSetting: ', path, value);
      ColibriClient.sendToWorker('change_setting', {
        path,
        value
      });
    };

    const ResourceItem = ({
      id,
      name,
      amount,
      max,
      income,
      incomeText,
      collapsed,
      isUseCondensedTime,
      bonusText
    }) => VirtualDOM.createVirtualElement("div", {
      resourceId: id,
      className: 'resource-line'
    }, VirtualDOM.createVirtualElement(ResourceIcon, {
      id: id
    }), !collapsed ? VirtualDOM.createVirtualElement("span", {
      className: 'resourceName'
    }, name) : null, VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement("span", {
      className: 'resourceAmount'
    }, fmtVal(amount)), max && !collapsed ? VirtualDOM.createVirtualElement("span", {
      className: 'resourceMax'
    }, " / ", fmtVal(max)) : null, income && !collapsed && id !== 'condensedTime' ? VirtualDOM.createVirtualElement("span", {
      className: `income ${income > 0 ? 'positive' : 'negative'}`
    }, income > 0 ? '+' : '', incomeText) : null, id === 'condensedTime' ? VirtualDOM.createVirtualElement("span", {
      className: 'popup-link',
      onClick: useCiCallback(flag => switchSetting$2('isUseCondensedTime', !flag), [isUseCondensedTime])
    }, isUseCondensedTime ? 'Turn off' : 'Turn on') : null), !collapsed && bonusText ? VirtualDOM.createVirtualElement("div", {
      className: 'bonus'
    }, bonusText) : null));
    const SidebarUI = ({
      resources,
      expanded,
      isUseCondensedTime,
      secondaryResources
    }) => VirtualDOM.createVirtualElement("div", {
      className: `sidebar ${expanded ? 'expanded' : 'collapsed'}`
    }, VirtualDOM.createVirtualElement("div", {
      className: 'inner-sidebar'
    }, VirtualDOM.createVirtualElement("div", {
      className: 'relative-wrap'
    }, VirtualDOM.createVirtualElement("div", {
      className: 'toggle-collapsed',
      onClick: useCiCallback(expanded => toggleExpanded(!expanded), [expanded])
    }, expanded ? '<' : '>'), resources ? resources.filter(one => one.isUnlocked).map(rs => VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement(ResourceItem, _extends({}, rs, {
      collapsed: !expanded,
      isUseCondensedTime: isUseCondensedTime
    })))) : VirtualDOM.createVirtualElement("span", null, "Loading..."), secondaryResources?.length ? VirtualDOM.createVirtualElement("p", {
      className: 'popup-link',
      onClick: useCiCallback(() => showModal('secondaryResources'))
    }, "More") : null)), VirtualDOM.createVirtualElement(Modal, {
      modalId: 'secondaryResources',
      title: 'Resources'
    }, VirtualDOM.createVirtualElement("div", {
      className: 'resources-block'
    }, secondaryResources ? secondaryResources.filter(one => one.isUnlocked).map(rs => VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement(ResourceItem, _extends({}, rs, {
      collapsed: !expanded,
      isUseCondensedTime: isUseCondensedTime
    })))) : VirtualDOM.createVirtualElement("span", null, "Loading..."))));
    const Sidebar = () => {
      const resources = State.queryState('game.resources', []);
      const resSettings = State.queryState('game.general.settings.resourcesDisplay');
      const expanded = State.queryState('game.ui.sidebarExpanded', true);
      const isUseCondensedTime = State.queryState('game.general.settings.isUseCondensedTime', false);
      const primaryResources = resources.filter(one => resSettings[one.id]);
      const secondaryResources = resources.filter(one => !resSettings[one.id]);
      return VirtualDOM.createVirtualElement(SidebarUI, {
        resources: primaryResources,
        expanded: expanded,
        isUseCondensedTime: isUseCondensedTime,
        secondaryResources: secondaryResources
      });
    };

    var css_248z$e = ".in-game {\n    display: flex;\n    padding: 20px;\n    margin-top: 100px;\n}\n\n.run-content {\n    flex: 1;\n    margin-bottom: 50px;\n}";
    styleInject(css_248z$e);

    var css_248z$d = ".actions {\n    display: flex;\n    flex-wrap: wrap;\n    justify-content: flex-start;\n}\n\n.action-wrapper {\n    width: 260px;\n    text-align: center;\n    margin: 5px;\n    padding: 10px;\n    background: #030304;\n}\n\n.action-wrapper button {\n    margin: 10px auto auto;\n    width: 180px;\n}\n\n.action-wrapper .produces,\n.action-wrapper .costs {\n    display: flex;\n    padding-left: 50px;\n}\n\n.action-wrapper .produces .resourceList,\n.action-wrapper .costs .resourceList {\n    padding-left: 10px;\n}\n\n.custom-gain {\n    margin-left: 5px;\n}\n\n.action-wrapper .note {\n    font-style: italic;\n    font-size: 12px;\n    color: #aaaaaa;\n}";
    styleInject(css_248z$d);

    const makeAction = id => {
      console.log('gather gold');
      ColibriClient.sendToWorker('do_action', id);
    };

    const automateAction = id => {
      ColibriClient.sendToWorker('automate_action', id);
    };

    ColibriClient.on('set_actions_state', payload => {
      State.setState('game.jobs.actions', payload);
    });
    const ActionsComponent = ({
      actions
    }) => VirtualDOM.createVirtualElement("div", {
      className: 'actions'
    }, actions ? actions.map(one => VirtualDOM.createVirtualElement("div", {
      className: 'action-wrapper'
    }, VirtualDOM.createVirtualElement("p", null, one.description), one.note ? VirtualDOM.createVirtualElement("p", {
      className: 'note'
    }, one.note) : null, VirtualDOM.createVirtualElement("div", {
      className: 'produces'
    }, VirtualDOM.createVirtualElement("p", null, "Produce:"), one.customGain ? VirtualDOM.createVirtualElement("p", {
      className: 'custom-gain',
      id: `custom-gain-${one.id}`
    }, one.customGain) : VirtualDOM.createVirtualElement(ResourcesList, {
      data: one.gain
    })), VirtualDOM.createVirtualElement("div", {
      className: 'costs'
    }, VirtualDOM.createVirtualElement("p", null, "Costs:"), VirtualDOM.createVirtualElement(ResourcesList, {
      data: one.cost
    })), VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement("p", null, "Cooldown:  ", one.timeout?.toFixed(2), "s")), one.automationEnabled && VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement("label", {
      onChange: useCiCallback(id => automateAction(id), [one.id])
    }, VirtualDOM.createVirtualElement("input", {
      type: 'checkbox',
      checked: one.isAutomated
    }), "Automated")), VirtualDOM.createVirtualElement("button", {
      className: 'main-action',
      onClick: useCiCallback(id => makeAction(id), [one.id]),
      disabled: !one.isAvailable
    }, one.name, " [", one.performed, "]"))) : VirtualDOM.createVirtualElement("p", null, "No actions available"));
    const Jobs = () => {
      whenMount(attrs => {
        console.log('mounted jobs with attrs', attrs);
      });
      whenUpdate((attrs, prev) => {
        console.log('updated jobs with attrs', attrs, prev);
      });
      const actions = State.queryState('game.jobs.actions');
      return VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement(ActionsComponent, {
        actions: actions
      }));
    };

    var css_248z$c = "\r\n.shop-settings {\r\n    margin: 0 5px 5px;\r\n    padding: 10px;\r\n    background: #030304;\r\n    display: flex;\r\n    align-items: center;\r\n    justify-content: space-between;\r\n}\r\n\r\n.shop-items {\r\n    display: flex;\r\n    flex-wrap: wrap;\r\n    justify-content: flex-start;\r\n}\r\n\r\n.shop-item-wrapper {\r\n    width: 260px;\r\n    text-align: center;\r\n    margin: 5px;\r\n    padding: 10px;\r\n    background: #030304;\r\n}\r\n\r\n.shop-item-wrapper button {\r\n    margin: auto;\r\n    width: 140px;\r\n}\r\n\r\n.item-resources {\r\n    padding-left: 50px;\r\n}";
    styleInject(css_248z$c);

    const makePurchase = id => {
      ColibriClient.sendToWorker('do_purchase', id);
    };

    const purchaseAll = () => {
      ColibriClient.sendToWorker('do_purchase_all');
    };

    const toggleShowPurchased = flag => {
      State.setState('game.shop.showPurchased', flag);
    };

    const toggleAutopurchase = flag => {
      ColibriClient.sendToWorker('set_autopurchase', flag);
    };

    ColibriClient.on('set_shopitems_state', payload => {
      State.setState('game.shop.items', payload);
    });
    const ShopSettings = ({
      showPurchased,
      autopurchaseUnlocked,
      autopurchaseOn
    }) => {
      return VirtualDOM.createVirtualElement("div", {
        className: 'shop-settings'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'flex'
      }, VirtualDOM.createVirtualElement("p", {
        className: 'popup-link',
        onClick: useCiCallback(flag => toggleShowPurchased(!flag), [showPurchased])
      }, showPurchased ? `Hide purchased` : `Show purchased`), autopurchaseUnlocked ? VirtualDOM.createVirtualElement("p", {
        className: 'popup-link',
        onClick: useCiCallback(flag => toggleAutopurchase(!flag), [autopurchaseOn])
      }, autopurchaseOn ? `Turn off auto purchase` : `Turn on auto purchase`) : null), VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement("button", {
        className: 'main-action',
        onClick: purchaseAll
      }, "Purchase all")));
    };
    const ShopItemComponent = ({
      items
    }) => {
      return VirtualDOM.createVirtualElement("div", {
        className: 'shop-items'
      }, items ? items.map(one => VirtualDOM.createVirtualElement("div", {
        className: 'shop-item-wrapper'
      }, VirtualDOM.createVirtualElement("p", null, one.description), VirtualDOM.createVirtualElement("div", {
        className: 'item-resources'
      }, VirtualDOM.createVirtualElement(ResourcesList, {
        data: one.cost
      })), VirtualDOM.createVirtualElement("button", {
        className: 'main-action',
        onClick: useCiCallback(id => makePurchase(id), [one.id]),
        disabled: !one.isAvailable || one.isPurchased
      }, one.name, one.isPurchased ? '(Sold)' : ''))) : VirtualDOM.createVirtualElement("p", null, "No purchases available"));
    };
    const Shop = () => {
      const items = State.queryState('game.shop.items');
      const showPurchased = State.queryState('game.shop.showPurchased', false);
      const autopurchaseOn = State.queryState('game.general.autopurchaseOn', false);
      const autopurchaseUnlocked = State.queryState('game.general.autopurchaseUnlocked', false);
      return VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement(ShopSettings, {
        showPurchased: showPurchased,
        autopurchaseOn: autopurchaseOn,
        autopurchaseUnlocked: autopurchaseUnlocked
      }), VirtualDOM.createVirtualElement(ShopItemComponent, {
        items: (items || []).filter(one => showPurchased || !one.isPurchased)
      }));
    };

    var css_248z$b = ".summon-creature {\r\n    display: flex;\r\n    justify-content: flex-start;\r\n    background: #030304;\r\n    padding: 20px;\r\n    width: 100%;\r\n}\r\n\r\n.summon-creature .change-amount {\r\n    margin-right: 10px;\r\n    margin-left: auto;\r\n}\r\n\r\n.summon-creature .cost-wrap {\r\n    margin-left: 20px;\r\n}\r\n\r\n.work-places {\r\n    background: #030304;\r\n    padding: 10px;\r\n}\r\n\r\n.work-places .job-row {\r\n    display: flex;\r\n    justify-content: space-between;\r\n    align-items: center;\r\n}\r\n.work-places .job-row > div {\r\n    width: 250px;\r\n}\r\n\r\n.work-places .job-row .actions {\r\n    align-items: center;\r\n    justify-content: space-around;\r\n}\r\n\r\n.creature-notes {\r\n    margin-left: 20px;\r\n    flex: 1;\r\n}\r\n\r\n.creature-name {\r\n    font-size: 14px;\r\n    font-weight: bold;\r\n}\r\n\r\n.summon-wrap {\r\n    min-width: 120px;\r\n    height: 101px;\r\n}\r\n\r\n.categories {\r\n    display: flex;\r\n}\r\n\r\n.categories .popup-link {\r\n    padding: 3px 5px;\r\n}\r\n\r\n.categories .selected {\r\n    color: #ffffff;\r\n}\r\n\r\n.creature-jobs-slider {\r\n    /* width: calc(100% - 40px);\r\n    margin: 5px 20px;*/\r\n    width: 210px;\r\n}\r\n\r\n.summon-buttons button {\r\n    display: block;\r\n    margin: 5px 0;\r\n}\r\n\r\n.creature-notes .red {\r\n    color: #ad2121;\r\n}";
    styleInject(css_248z$b);

    const summon = amount => {
      ColibriClient.sendToWorker('do_summon', amount);
    };

    const changeWorkes = (id, amount) => {
      ColibriClient.sendToWorker('change_workers', {
        id,
        amount
      });
    };

    const change_amount = amount => {
      ColibriClient.sendToWorker('set_amount', {
        amount
      });
    };

    const selectCategory$1 = cat => {
      State.setState('game.creatures.category', cat);
    };

    ColibriClient.on('set_creatures_state', payload => {
      State.setState('game.creatures.summon', payload);
    });
    ColibriClient.on('set_creatures_jobs_state', payload => {
      State.setState('game.creatures.jobs', payload);
    });
    const CreatureJobs = ({
      jobs,
      freeWorkers,
      amount,
      categories,
      selectedCat,
      controlsSettings
    }) => {
      return VirtualDOM.createVirtualElement("div", {
        className: 'work-places'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'flex'
      }, VirtualDOM.createVirtualElement("p", {
        className: 'free-amt'
      }, `Free workers:  ${freeWorkers}`), VirtualDOM.createVirtualElement("div", {
        className: 'categories'
      }, categories.map(one => {
        return VirtualDOM.createVirtualElement("p", {
          className: `popup-link ${one === selectedCat ? 'selected' : ''}`,
          onClick: useCiCallback(cat => selectCategory$1(cat), [one])
        }, one);
      }))), VirtualDOM.createVirtualElement("div", {
        className: 'job-rows'
      }, jobs ? jobs.map(one => VirtualDOM.createVirtualElement("div", {
        className: 'job-row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'name'
      }, VirtualDOM.createVirtualElement("p", {
        className: 'creature-name'
      }, one.name), VirtualDOM.createVirtualElement("p", null, one.description)), VirtualDOM.createVirtualElement("div", {
        className: 'income'
      }, VirtualDOM.createVirtualElement("p", null, "Produce: "), VirtualDOM.createVirtualElement(ResourcesList, {
        data: one.gain
      }), VirtualDOM.createVirtualElement("p", null, "Efficiency: ", fmtVal(one.efficiency * 100), "%")), VirtualDOM.createVirtualElement("div", {
        className: 'outcome'
      }, VirtualDOM.createVirtualElement("p", null, "Consume: "), VirtualDOM.createVirtualElement(ResourcesList, {
        data: one.cost
      })), VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement("div", {
        className: 'actions'
      }, ['buttons', 'both'].includes(controlsSettings) ? VirtualDOM.createVirtualElement("button", {
        className: 'main-action',
        onClick: useCiCallback((id, amount) => changeWorkes(id, -amount), [one.id, amount]),
        disabled: one.current <= 0
      }, "-", amount) : null, VirtualDOM.createVirtualElement("span", null, one.current), ['buttons', 'both'].includes(controlsSettings) ? VirtualDOM.createVirtualElement("button", {
        className: 'main-action',
        onClick: useCiCallback((id, amount) => changeWorkes(id, amount), [one.id, amount]),
        disabled: freeWorkers <= 0
      }, "+", amount) : null), ['slider', 'both'].includes(controlsSettings) ? VirtualDOM.createVirtualElement("input", {
        type: 'range',
        className: 'creature-jobs-slider',
        name: `workers-${one.id}`,
        min: "0",
        max: `${freeWorkers + one.current}`,
        value: `${one.current}`,
        onChange: useCiCallback((id, amount, e) => {
          changeWorkes(id, e.target.value - amount);
        }, [one.id, one.current])
      }) : null))) : VirtualDOM.createVirtualElement("p", null, "No jobs available")));
    };
    const SummonCreature = ({
      info
    }) => {
      return VirtualDOM.createVirtualElement("div", {
        className: 'summon-creature'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'summon-wrap'
      }, VirtualDOM.createVirtualElement("p", null, "Total creatures: ", info?.numCreatures), VirtualDOM.createVirtualElement("div", {
        className: 'summon-buttons'
      }, VirtualDOM.createVirtualElement("button", {
        className: 'main-action',
        onClick: useCiCallback(amount => summon(amount), [info?.amount]),
        disabled: !info?.cost?.isAvailable
      }, "Summon (x", info?.amount, ")"), info?.max ? VirtualDOM.createVirtualElement("button", {
        className: 'main-action',
        onClick: useCiCallback(amount => summon(1.e+306), [info?.max]),
        disabled: !info?.cost?.isAvailable
      }, "Summon max (x", info?.max, ")") : null)), VirtualDOM.createVirtualElement("div", {
        className: 'cost-wrap'
      }, VirtualDOM.createVirtualElement("p", null, "Cost:"), VirtualDOM.createVirtualElement(ResourcesList, {
        data: info?.cost
      })), VirtualDOM.createVirtualElement("div", {
        className: 'creature-notes'
      }, VirtualDOM.createVirtualElement("p", null, "Requires ", VirtualDOM.createVirtualElement("span", {
        className: !info.isEnoughEnergy ? 'red' : 'regular'
      }, fmtVal(info.energyRequired)), " max energy at least"), VirtualDOM.createVirtualElement("p", null, "Every creature consumes ", fmtVal(info?.consumptionPerCreature), " energy per second. When you run out of energy your creatures will disappear. Make sure you have enough energy production before spending precious souls.")), VirtualDOM.createVirtualElement("div", {
        className: 'change-amount'
      }, VirtualDOM.createVirtualElement("p", null, "Amount per click:"), VirtualDOM.createVirtualElement("input", {
        type: 'number',
        onChange: useCiCallback(e => change_amount(e.target.value)),
        value: info?.amount
      })));
    };
    const Creatures = () => {
      const info = State.queryState('game.creatures.summon', {});
      const jobs = State.queryState('game.creatures.jobs', []);
      const selectedCat = State.queryState('game.creatures.category', 'All');
      const byCats = {
        All: []
      };
      jobs?.jobs?.filter(one => one.isUnlocked).forEach(one => {
        byCats.All.push(one);

        if (!byCats[one.category]) {
          byCats[one.category] = [];
        }

        byCats[one.category].push(one);
      });
      const categories = Object.keys(byCats);
      const controlsSettings = State.queryState('game.general.settings.inputControls.creatureJobs', 'both');
      return VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement(SummonCreature, {
        info: info
      }), VirtualDOM.createVirtualElement(CreatureJobs, {
        jobs: byCats[selectedCat],
        categories: categories,
        freeWorkers: jobs?.free,
        amount: info?.amount,
        selectedCat: selectedCat,
        controlsSettings: controlsSettings
      }));
    };

    var css_248z$a = ".skills-container .skills-settings {\r\n    background: #030304;\r\n    padding: 20px;\r\n    margin-bottom: 10px;\r\n}\r\n\r\n.skills-rows {\r\n    background: #030304;\r\n    padding: 20px;\r\n}\r\n\r\n.skills-container .skill-row {\r\n    display: flex;\r\n    justify-content: space-between;\r\n    align-items: center;\r\n}\r\n.skills-container .skill-row > div {\r\n    width: 200px;\r\n}\r\n\r\n.skills-container .skill-row .xp-bar {\r\n    width: 300px;\r\n}\r\n\r\n.skills-container .skill-row .xp-bar .outer-span {\r\n    width: 300px;\r\n}\r\n.skills-container .skill-row .xp-bar .tiny {\r\n    font-size: 12px;\r\n    text-align: right;\r\n    margin: 0;\r\n}\r\n\r\n\r\n.skills-container .skill-row .actions {\r\n    display: block;\r\n}\r\n\r\n.skills-container .skill-row .actions .effort {\r\n    margin: 0 5px;\r\n}\r\n\r\n.learning-slider {\r\n    width: 190px;\r\n}";
    styleInject(css_248z$a);

    const ProgressBar = ({
      progress,
      max,
      disabled,
      progressing,
      className = ''
    }) => {
      return VirtualDOM.createVirtualElement("div", {
        className: 'progress-wrap'
      }, VirtualDOM.createVirtualElement("div", {
        className: `outer-span${disabled ? ' disabled' : ''}${progressing ? ' progressing' : ''} ${className}`
      }, VirtualDOM.createVirtualElement("div", {
        className: 'inner-span',
        style: `width: ${max > 0 ? 100 * progress / max : 0}%`
      })));
    };

    const setAllValue = value => {
      State.setState('game.learning.value', +value);
    };

    const changeEfforts$1 = (id, amount) => {
      console.log('change_learning_efforts', {
        id,
        efforts: amount
      });
      ColibriClient.sendToWorker('change_learning_efforts', {
        id,
        efforts: amount
      });
    };

    const setEffortZero = () => {
      ColibriClient.sendToWorker('all_learning_efforts', {
        val: 0
      });
    };

    const setEffortToAmount = amt => {
      ColibriClient.sendToWorker('all_learning_efforts', {
        val: amt
      });
    };

    ColibriClient.on('set_skills_state', payload => {
      State.setState('game.learning.skills', payload);
    });
    const Skills = ({
      skills,
      amount,
      controlsSettings,
      maxEnergy,
      enIncome
    }) => {
      let enIncomeCached = State.queryState('game.learning.cachedEnIncome');

      if (!enIncomeCached || Math.abs((enIncomeCached - enIncome) / (enIncome + 1.e-50)) > 0.01) {
        enIncomeCached = enIncome;
        State.setState('game.learning.cachedEnIncome', enIncomeCached);
      }

      return VirtualDOM.createVirtualElement("div", {
        className: 'skills-container'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'skills-settings flex'
      }, VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement("p", null, "By setting effort you are setting amount of energy you will spend per second to learn skill.")), VirtualDOM.createVirtualElement("div", {
        className: 'change-amount'
      }, VirtualDOM.createVirtualElement("p", null, "Amount per click:"), VirtualDOM.createVirtualElement("input", {
        type: 'number',
        onChange: useCiCallback(e => setAllValue(e.target.value)),
        value: amount
      })), VirtualDOM.createVirtualElement("div", {
        className: 'change-to-zero'
      }, VirtualDOM.createVirtualElement("button", {
        className: 'main-action',
        onClick: useCiCallback(amt => setEffortToAmount(amt), [amount])
      }, `Set all to ${fmtVal(amount)}`), VirtualDOM.createVirtualElement("button", {
        className: 'main-action',
        onClick: setEffortZero
      }, "Set all to 0"))), VirtualDOM.createVirtualElement("div", {
        className: 'skills-rows'
      }, skills ? skills.map(one => VirtualDOM.createVirtualElement("div", {
        className: `skill-row`,
        id: `skill-row-${one.id}`
      }, VirtualDOM.createVirtualElement("div", {
        className: 'name'
      }, VirtualDOM.createVirtualElement("p", null, one.name, " [", one.level, "]")), VirtualDOM.createVirtualElement("div", {
        className: 'description'
      }, VirtualDOM.createVirtualElement("p", null, one.description)), VirtualDOM.createVirtualElement("div", {
        className: 'xp-bar'
      }, VirtualDOM.createVirtualElement("p", {
        className: 'tiny'
      }, fmtVal(one.xp), " / ", fmtVal(one.maxXp), " XP"), VirtualDOM.createVirtualElement(ProgressBar, {
        progress: one.xp,
        max: one.maxXp,
        progressing: one.efforts > 0
      })), VirtualDOM.createVirtualElement("div", {
        className: 'actions'
      }, VirtualDOM.createVirtualElement("p", null, "Set energy spent"), VirtualDOM.createVirtualElement("div", {
        className: 'flex'
      }, ['buttons', 'both'].includes(controlsSettings) ? VirtualDOM.createVirtualElement("button", {
        className: 'main-action',
        onClick: useCiCallback((id, amount, c) => changeEfforts$1(id, +c - amount), [one.id, amount, one.efforts])
      }, "-", fmtVal(amount)) : null, VirtualDOM.createVirtualElement("span", {
        className: 'effort'
      }, fmtVal(one.efforts)), ['buttons', 'both'].includes(controlsSettings) ? VirtualDOM.createVirtualElement("button", {
        className: 'main-action',
        onClick: useCiCallback((id, amount, c) => changeEfforts$1(id, +c + amount), [one.id, amount, one.efforts])
      }, "+", fmtVal(amount)) : null), ['slider', 'both'].includes(controlsSettings) ? VirtualDOM.createVirtualElement("input", {
        type: 'range',
        className: 'learning-slider',
        name: `workers-${one.id}`,
        min: "0",
        max: `${Math.max(maxEnergy, enIncomeCached + +one.efforts)}`,
        value: `${one.efforts}`,
        onChange: useCiCallback((id, e) => {
          changeEfforts$1(id, e.target.value);
        }, [one.id])
      }) : null))) : VirtualDOM.createVirtualElement("p", null, "No skills available")));
    };
    const Learning = () => {
      const skills = State.queryState('game.learning.skills', []);
      const defaultValue = State.queryState('game.learning.value', 0.5);
      const controlsSettings = State.queryState('game.general.settings.inputControls.learning', 'both');
      const rs = State.queryState('game.resources', []);
      const maxEnergy = rs.find(one => one.id === 'energy')?.max;
      const enIncome = rs.find(one => one.id === 'energy')?.income;
      return VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement(Skills, {
        skills: skills?.filter(one => one.isUnlocked),
        amount: defaultValue,
        controlsSettings: controlsSettings,
        maxEnergy: maxEnergy,
        enIncome: enIncome
      }));
    };

    var css_248z$9 = "\r\n.banners-container {\r\n    padding: 10px;\r\n}\r\n\r\n.banners-container .info-container {\r\n    background: #030304;\r\n    padding: 10px 20px;\r\n}\r\n\r\n.flex-banner {\r\n    display: flex;\r\n    justify-content: space-between;\r\n}\r\n\r\n.banners-container .banners-row {\r\n    display: flex;\r\n    justify-content: space-between;\r\n}\r\n\r\n.banners-container .banner-row {\r\n    margin-top: 10px;\r\n    background: #030304;\r\n    padding: 10px 20px;\r\n}\r\n\r\n.banners-container .banner-box .action-buttons button{\r\n    width: 150px;\r\n    margin-bottom: 5px;\r\n}\r\n\r\n.banners-container .tiers-row {\r\n    display: flex;\r\n    justify-content: flex-start;\r\n    align-items: center;\r\n}\r\n.banners-container .tiers-row > .banner-box {\r\n    width: 160px;\r\n    height: 150px;\r\n}\r\n\r\n.inner-banner {\r\n    padding-left: 10px;\r\n    position: relative;\r\n}\r\n\r\n.inner-banner .convert-icon {\r\n    position: absolute;\r\n    width: 24px;\r\n    height: 24px;\r\n    right: 12px;\r\n    top: 2px;\r\n    cursor: pointer;\r\n}\r\n\r\n.inner-banner .amount {\r\n    font-weight: bold;\r\n    font-size: 15px;\r\n}\r\n\r\n.skills-container .skill-row .actions {\r\n\r\n}\r\n\r\n.banners-note {\r\n    /* font-style: italic; */\r\n}\r\n\r\n.right-box {\r\n    margin-left: 20px;\r\n}\r\n\r\n.revert .undo-icon {\r\n    width: 32px;\r\n    height: 32px;\r\n    margin: auto;\r\n    cursor: pointer;\r\n    opacity: 0.7;\r\n    display: block;\r\n    object-fit: contain;\r\n}\r\n\r\n.revert .undo-icon:hover {\r\n    opacity: 1;\r\n}";
    styleInject(css_248z$9);

    const Icon = ({
      scope,
      id,
      className,
      onClick,
      alt
    }) => VirtualDOM.createVirtualElement("span", {
      className: `icon-wrap ${className}`,
      onClick: onclick
    }, VirtualDOM.createVirtualElement("img", {
      src: `${HTTP_PATH}static/icons/${scope}/${id}.png`,
      title: alt
    }));

    const prestige = id => {
      console.log('prestieging', id);
      ColibriClient.sendToWorker('do_prestige', id);
    };

    const optimizeAll = id => {
      ColibriClient.sendToWorker('do_optimize', id);
    };

    const revertBanner = id => {
      console.log('reverting', id);
      ColibriClient.sendToWorker('do_revert_banner', id);
    };

    const convert = (id, tierIndex, percentage = 1) => {
      console.log('converting', id, tierIndex);
      ColibriClient.sendToWorker('do_convert', {
        id,
        tierIndex,
        percentage
      });
    };

    ColibriClient.on('set_banners_state', payload => {
      State.setState('game.banners.data', payload);
    });
    const BannerRow = ({
      banner
    }) => VirtualDOM.createVirtualElement("div", {
      className: 'banner-row'
    }, VirtualDOM.createVirtualElement("div", {
      className: 'flex-banner'
    }, VirtualDOM.createVirtualElement("div", {
      className: 'info'
    }, VirtualDOM.createVirtualElement("h5", null, banner.name), VirtualDOM.createVirtualElement("p", null, banner.description)), VirtualDOM.createVirtualElement("div", {
      className: 'right-box'
    }, banner.tiers && banner.isChanged ? VirtualDOM.createVirtualElement("div", {
      className: 'revert'
    }, VirtualDOM.createVirtualElement("div", {
      onClick: useCiCallback(id => revertBanner(id), [banner.id, 'revert'])
    }, VirtualDOM.createVirtualElement(Icon, {
      scope: 'ui',
      id: 'undo',
      className: 'undo-icon'
    })), VirtualDOM.createVirtualElement("p", null, "Revert changes")) : null, banner.isShowOptimizeAll ? VirtualDOM.createVirtualElement("div", {
      className: 'optimize-all'
    }, VirtualDOM.createVirtualElement("button", {
      className: 'main-action',
      onClick: useCiCallback(id => optimizeAll(id), [banner.id, 'optimize'])
    }, "Optimize")) : null)), VirtualDOM.createVirtualElement("div", {
      className: 'tiers-row'
    }, banner.tiers ? banner.tiers.map((tier, index) => VirtualDOM.createVirtualElement("div", {
      className: 'banner-box'
    }, VirtualDOM.createVirtualElement("div", {
      className: 'inner-banner',
      style: `border-left: 10px solid ${banner.color};`
    }, tier.suggestConversion ? VirtualDOM.createVirtualElement(Icon, {
      scope: 'ui',
      id: 'convert',
      className: 'convert-icon',
      alt: 'We suggest you to convert 10% of previous banner into this one'
    }) : null, VirtualDOM.createVirtualElement("p", null, "Tier ", index), VirtualDOM.createVirtualElement("span", {
      className: 'amount'
    }, fmtVal(tier.amount)), VirtualDOM.createVirtualElement("p", null, fmtVal(tier.effectCumulative * 100), "%")), VirtualDOM.createVirtualElement("div", null, tier.canPrestige ? VirtualDOM.createVirtualElement("button", {
      className: 'main-action',
      onClick: useCiCallback(id => prestige(id), [banner.id])
    }, "Prestige (+", fmtVal(tier.maxConversion), ")") : null, tier.timeLeft ? VirtualDOM.createVirtualElement("span", null, tier.timeLeft) : null, tier.isConvertable ? VirtualDOM.createVirtualElement("div", {
      className: 'action-buttons'
    }, VirtualDOM.createVirtualElement("button", {
      className: 'main-action',
      onClick: useCiCallback((id, tierIndex) => convert(id, tierIndex), [banner.id, index])
    }, "Convert (+", fmtVal(tier.maxConversion), ")"), VirtualDOM.createVirtualElement("button", {
      className: 'main-action',
      onClick: useCiCallback((id, tierIndex) => convert(id, tierIndex, 0.1), [banner.id, index]),
      disabled: tier.maxConversion < 10
    }, "Convert 10%(+", fmtVal(tier.maxConversion * 0.1), ")")) : null))) : null));
    const BannersUI = ({
      banners
    }) => {
      return VirtualDOM.createVirtualElement("div", {
        className: 'banners-container'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'info-container'
      }, VirtualDOM.createVirtualElement("p", {
        className: 'banners-note'
      }, "By prestiging you will lose all your skills, spells, actions and shop items. But, you will gain some amount of tier 1 banners you selected. The amount depends on currently summoned creatures you have."), VirtualDOM.createVirtualElement("p", {
        className: 'banners-note'
      }, "Each banner type has several tiers. Each tier after first multiplies effect of previous one. By converting all your banners to higher tier you will loose all previous tier banners. For example, converting 2nd tier to 3rd will remove 2nd tier banners, add 5 times smaller amount to 3rd tier. Other tiers will keep the same.")), banners ? banners.map(one => VirtualDOM.createVirtualElement(BannerRow, {
        banner: one
      })) : VirtualDOM.createVirtualElement("p", null, "No banners available"));
    };
    const Banners = () => {
      const banners = State.queryState('game.banners.data', []);
      return VirtualDOM.createVirtualElement("div", {
        className: 'banners-page'
      }, VirtualDOM.createVirtualElement(BannersUI, {
        banners: (banners || []).filter(one => one.isUnlocked)
      }));
    };

    var css_248z$8 = ".researches {\r\n    display: flex;\r\n    flex-wrap: wrap;\r\n    justify-content: flex-start;\r\n}\r\n\r\n.research-wrapper {\r\n    width: 260px;\r\n    text-align: center;\r\n    margin: 5px;\r\n    padding: 10px;\r\n    background: #030304;\r\n}\r\n\r\n.research-wrapper button {\r\n    margin: 10px auto auto;\r\n    width: 140px;\r\n}\r\n\r\n\r\n.research-wrapper .costs {\r\n    display: flex;\r\n    padding-left: 50px;\r\n}\r\n\r\n.research-wrapper .costs .resourceList {\r\n    padding-left: 10px;\r\n}\r\n\r\n.research-settings {\r\n    margin: 0 5px 5px;\r\n    padding: 10px;\r\n    background: #030304;\r\n    display: flex;\r\n    align-items: center;\r\n    justify-content: space-between;\r\n}\r\n\r\n.maxed-out {\r\n    color: #aaa;\r\n}";
    styleInject(css_248z$8);

    const doResearch = id => {
      console.log('do research', id);
      ColibriClient.sendToWorker('do_research', id);
    };

    ColibriClient.on('set_research_state', payload => {
      State.setState('game.research.data', payload);
    });

    const toggleShowResearched = flag => {
      State.setState('game.research.showResearched', flag);
    };

    const toggleShowUnavailable = flag => {
      State.setState('game.research.showUnavailable', flag);
    };

    const ResearchSettings = ({
      showResearched,
      showUnavailable
    }) => {
      return VirtualDOM.createVirtualElement("div", {
        className: 'research-settings'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'flex'
      }, VirtualDOM.createVirtualElement("p", {
        className: 'popup-link',
        onClick: useCiCallback(flag => toggleShowResearched(!flag), [showResearched])
      }, showResearched ? `Hide researched` : `Show researched`), VirtualDOM.createVirtualElement("p", {
        className: 'popup-link',
        onClick: useCiCallback(flag => toggleShowUnavailable(!flag), [showUnavailable])
      }, showUnavailable ? `Hide unavailable` : `Show unavailable`)), VirtualDOM.createVirtualElement("div", null));
    };
    const ResearchComponent = ({
      research
    }) => VirtualDOM.createVirtualElement("div", {
      className: 'researches'
    }, research ? research.map(one => VirtualDOM.createVirtualElement("div", {
      className: 'research-wrapper'
    }, VirtualDOM.createVirtualElement("h5", null, one.name, " [", one.level, `${one.potential ? ` (+${one.potential})` : ``}`, " ", `${one.max ? `/ ${one.max}` : ``}`, "]"), VirtualDOM.createVirtualElement("p", null, one.description), !one.isMaxed ? VirtualDOM.createVirtualElement("div", {
      className: 'costs'
    }, VirtualDOM.createVirtualElement("p", null, "Costs:"), VirtualDOM.createVirtualElement(ResourcesList, {
      data: one.cost
    })) : VirtualDOM.createVirtualElement("p", {
      className: 'maxed-out'
    }, "Maxed out"), VirtualDOM.createVirtualElement("button", {
      className: 'main-action',
      onClick: useCiCallback(id => doResearch(id), [one.id]),
      disabled: !one.isAvailable
    }, "Research"))) : VirtualDOM.createVirtualElement("p", null, "No researches available"));
    const Research = () => {
      const research = State.queryState('game.research.data', []);
      const showResearched = State.queryState('game.research.showResearched', false);
      const showUnavailable = State.queryState('game.research.showUnavailable', true);
      return VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement(ResearchSettings, {
        showResearched: showResearched,
        showUnavailable: showUnavailable
      }), VirtualDOM.createVirtualElement(ResearchComponent, {
        research: research?.filter(one => one.isUnlocked || one.level > 0)?.filter(one => (showResearched || !one.max || one.level < one.max) && (showUnavailable || one.isAvailable))
      }));
    };

    var css_248z$7 = "\r\n.mapInfo, .fighting {\r\n    background: #030304;\r\n    padding: 20px;\r\n}\r\n\r\n.mapInfo .info h5 {\r\n    width: 200px;\r\n    margin-right: 20px;\r\n}\r\n\r\n.map-settings {\r\n    display: flex;\r\n    justify-content: space-between;\r\n}\r\n\r\n.fighting {\r\n    margin-top: 10px;\r\n}\r\n\r\n.fighting .sides {\r\n    display: flex;\r\n    justify-content: space-between;\r\n    align-items: center;\r\n}\r\n.sides .side {\r\n    padding: 10px;\r\n    margin: 10px;\r\n    width: 280px;\r\n}\r\n\r\n.sides .side p {\r\n    margin-block-start: 0.25em;\r\n    margin-block-end: 0.25em;\r\n}\r\n\r\n.flex-block {\r\n    display: flex;\r\n    justify-content: space-between;\r\n}\r\n\r\n.flex-block.padded {\r\n    padding: 3px 0;\r\n}\r\n\r\n.flex-block .note {\r\n    font-size: 11px;\r\n    font-style: italic;\r\n}\r\n\r\n.item-with-icon {\r\n    display: flex;\r\n}\r\n\r\n.item-with-icon img {\r\n    object-fit: contain;\r\n    width: 18px;\r\n    height: 18px;\r\n    margin-right: 5px;\r\n}\r\n\r\n.boss-button {\r\n    margin: auto 20px;\r\n    width: 200px;\r\n}";
    styleInject(css_248z$7);

    const toggleMap = e => {
      e.preventDefault();
      e.stopImmediatePropagation();
      ColibriClient.sendToWorker('toggle_battle');
    };

    const toggleForward = e => {
      e.preventDefault();
      e.stopImmediatePropagation();
      ColibriClient.sendToWorker('toggle_forward');
    };

    ColibriClient.on('set_map_state', payload => {
      State.setState('game.battle.map', payload);
    });
    ColibriClient.on('set_battle_state', payload => {
      State.setState('game.battle.fight', payload);
    });

    function goToLevel(e) {
      ColibriClient.sendToWorker('set_battle_level', {
        level: Number.isNaN(+e.target.value) ? 0 : +e.target.value
      });
    }

    function toggleBattleMode(fightMode) {
      ColibriClient.sendToWorker('toggle_battle_mode', {
        fightMode
      });
    }

    const MapInfo = ({
      map,
      isBuildingUnlocked
    }) => VirtualDOM.createVirtualElement("div", {
      className: 'mapInfo'
    }, VirtualDOM.createVirtualElement("div", {
      className: 'menu categories'
    }, VirtualDOM.createVirtualElement("p", {
      className: `popup-link ${map.fightMode === 0 ? 'selected' : ''}`,
      onClick: useCiCallback(() => toggleBattleMode(0), [])
    }, "Map"), isBuildingUnlocked ? VirtualDOM.createVirtualElement("p", {
      className: `popup-link ${map.fightMode === 1 ? 'selected' : ''}`,
      onClick: useCiCallback(() => toggleBattleMode(1), [])
    }, "Bosses") : null), map.fightMode === 0 ? VirtualDOM.createVirtualElement("div", {
      className: 'map-block'
    }, VirtualDOM.createVirtualElement("div", {
      className: 'flex info'
    }, VirtualDOM.createVirtualElement("h5", null, "Map [", map.level, "]"), VirtualDOM.createVirtualElement("p", {
      className: 'description'
    }, "You progress over map each time you win a battle. Each won battle provides you some souls (Higher map level - greater amount). Once you clear cell 100 you finish map, and provided some territory (Amount depends on map level also). If you turn off auto toggle next map, you will restart your current map.")), VirtualDOM.createVirtualElement("div", {
      className: 'map-settings'
    }, VirtualDOM.createVirtualElement("div", {
      className: 'progress'
    }, VirtualDOM.createVirtualElement("p", null, "Progress: ", map.cell, " / 100"), VirtualDOM.createVirtualElement("button", {
      className: 'main-action',
      onClick: toggleMap,
      disabled: !map.isFightAvailable
    }, map.isTurnedOn ? 'Exit fight' : 'Enter fight')), VirtualDOM.createVirtualElement("div", {
      className: 'zone-level',
      id: 'zone-level'
    }, VirtualDOM.createVirtualElement("p", {
      className: 'go-to-map'
    }, "Go to map level (max - ", map.maxLevel || 0, ")"), VirtualDOM.createVirtualElement("input", {
      type: 'number',
      value: map.level,
      onChange: goToLevel
    }), VirtualDOM.createVirtualElement("p", {
      className: 'terr-gain'
    }, "You get ", ' ', VirtualDOM.createVirtualElement(ResourceIcon, {
      id: 'territory'
    }), fmtVal(map.territoryPerMap), " per finished map")), VirtualDOM.createVirtualElement("div", {
      className: 'zone-settings'
    }, VirtualDOM.createVirtualElement("p", null, "Toggle auto-next map: ", VirtualDOM.createVirtualElement("span", null, map.isForward ? 'On' : 'Off')), VirtualDOM.createVirtualElement("button", {
      className: 'main-action',
      onClick: toggleForward,
      disabled: !map.isFightAvailable
    }, map.isForward ? 'Set Turned Off' : 'Set Turned On')))) : null, map.fightMode === 1 ? VirtualDOM.createVirtualElement("div", {
      className: 'boss-block'
    }, VirtualDOM.createVirtualElement("div", {
      className: 'flex info'
    }, VirtualDOM.createVirtualElement("h5", null, "Boss [", map.bossesArena?.level || 0, "]"), VirtualDOM.createVirtualElement("div", {
      className: 'boss-button'
    }, VirtualDOM.createVirtualElement("button", {
      className: 'main-action',
      onClick: toggleMap,
      disabled: !map.isFightAvailable
    }, map.isTurnedOn ? 'Exit fight' : 'Enter fight')), VirtualDOM.createVirtualElement("p", {
      className: 'description'
    }, "Bosses are tough, but when you win boss fights you awarded precious resource - fame. Each unit of fame acts as multiplier to your monuments gain (Meaning you will gain more prestige on reset)."))) : null);
    const Fight = ({
      fight,
      map
    }) => {
      if ((!fight.parties || !map.isTurnedOn) && !map.myPreview) return VirtualDOM.createVirtualElement("p", null, "None");

      if (map.coolDown) {
        return VirtualDOM.createVirtualElement("div", {
          className: 'fighting'
        }, VirtualDOM.createVirtualElement("h2", null, "Your fighters are healing"), VirtualDOM.createVirtualElement("h2", null, map.coolDown));
      }

      const me = fight.parties && fight.parties.me ? fight.parties.me : map.myPreview;
      let enemy = null;

      if (fight.parties && map.isTurnedOn) {
        enemy = fight.parties.enemy;
      } else if (map.fightMode === 1 && map.bossPreview) {
        enemy = map.bossPreview;
      }

      if (!me) {
        return VirtualDOM.createVirtualElement("p", null, "None");
      }

      return VirtualDOM.createVirtualElement("div", {
        className: 'fighting'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'sides'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'side me'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'flex-block'
      }, VirtualDOM.createVirtualElement("p", null, me.name, "(x", me.quantity, ")"), VirtualDOM.createVirtualElement("p", {
        className: 'item-with-icon'
      }, VirtualDOM.createVirtualElement("img", {
        src: `${HTTP_PATH}static/icons/battle/hp.png`
      }), fmtVal(me.realHP))), VirtualDOM.createVirtualElement(ProgressBar, {
        progress: me.realHP,
        max: me.maxRealHP,
        className: 'blue'
      }), VirtualDOM.createVirtualElement("div", {
        className: 'flex-block'
      }, VirtualDOM.createVirtualElement("p", {
        className: 'item-with-icon'
      }, VirtualDOM.createVirtualElement("img", {
        src: `${HTTP_PATH}static/icons/battle/attack.png`
      }), fmtVal(me.damage)), VirtualDOM.createVirtualElement("p", {
        className: 'item-with-icon'
      }, VirtualDOM.createVirtualElement("img", {
        src: `${HTTP_PATH}static/icons/battle/defense.png`
      }), fmtVal(me.defense))), VirtualDOM.createVirtualElement("div", {
        className: 'flex-block padded'
      }, VirtualDOM.createVirtualElement("p", null, "Armor: ", VirtualDOM.createVirtualElement("span", null, fmtVal(me.armor))), me.dmgMitigation ? VirtualDOM.createVirtualElement("p", {
        className: 'note'
      }, "Dmg. mitigation: ", VirtualDOM.createVirtualElement("span", null, fmtVal(100 * (1 - me.dmgMitigation)), "%")) : null), VirtualDOM.createVirtualElement("div", {
        className: 'flex-block padded'
      }, VirtualDOM.createVirtualElement("p", null, "Precision: ", VirtualDOM.createVirtualElement("span", null, fmtVal(me.accuracy))), me.chanceToHit ? VirtualDOM.createVirtualElement("p", {
        className: 'note'
      }, "Hit chance: ", VirtualDOM.createVirtualElement("span", null, fmtVal(100 * me.chanceToHit), "%")) : null), VirtualDOM.createVirtualElement("div", {
        className: 'flex-block padded'
      }, VirtualDOM.createVirtualElement("p", null, "Evasion: ", VirtualDOM.createVirtualElement("span", null, fmtVal(me.evasion))), me.chanceToEvade ? VirtualDOM.createVirtualElement("p", {
        className: 'note'
      }, "Evade chance: ", VirtualDOM.createVirtualElement("span", null, fmtVal(100 * me.chanceToEvade), "%")) : null), VirtualDOM.createVirtualElement("div", {
        className: 'flex-block padded'
      }, VirtualDOM.createVirtualElement("p", null, "Crit. Chance: ", VirtualDOM.createVirtualElement("span", null, fmtVal(100 * me.critChance), "%")), VirtualDOM.createVirtualElement("p", null, "Crit. Mult: ", VirtualDOM.createVirtualElement("span", null, "x", fmtVal(me.critMult))))), VirtualDOM.createVirtualElement("span", null, fight.parties.me?.hitStatus), VirtualDOM.createVirtualElement("h2", null, "VS"), VirtualDOM.createVirtualElement("span", null, fight.parties.enemy?.hitStatus), enemy ? VirtualDOM.createVirtualElement("div", {
        className: 'side enemy'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'flex-block'
      }, VirtualDOM.createVirtualElement("p", null, enemy.name), VirtualDOM.createVirtualElement("p", {
        className: 'item-with-icon'
      }, VirtualDOM.createVirtualElement("img", {
        src: `${HTTP_PATH}static/icons/battle/hp.png`
      }), fmtVal(enemy.realHP), " (x", enemy.quantity, ")")), VirtualDOM.createVirtualElement(ProgressBar, {
        progress: enemy.realHP,
        max: enemy.maxRealHP,
        className: 'blue'
      }), VirtualDOM.createVirtualElement("div", {
        className: 'flex-block'
      }, VirtualDOM.createVirtualElement("p", {
        className: 'item-with-icon'
      }, VirtualDOM.createVirtualElement("img", {
        src: `${HTTP_PATH}static/icons/battle/attack.png`
      }), fmtVal(enemy.damage)), VirtualDOM.createVirtualElement("p", {
        className: 'item-with-icon'
      }, VirtualDOM.createVirtualElement("img", {
        src: `${HTTP_PATH}static/icons/battle/defense.png`
      }), fmtVal(enemy.defense))), VirtualDOM.createVirtualElement("div", {
        className: 'flex-block padded'
      }, VirtualDOM.createVirtualElement("p", null, "Armor: ", VirtualDOM.createVirtualElement("span", null, fmtVal(enemy.armor))), enemy.dmgMitigation ? VirtualDOM.createVirtualElement("p", {
        className: 'note'
      }, "Dmg. mitigation: ", VirtualDOM.createVirtualElement("span", null, fmtVal((1 - enemy.dmgMitigation) * 100), "%")) : null), VirtualDOM.createVirtualElement("div", {
        className: 'flex-block padded'
      }, VirtualDOM.createVirtualElement("p", null, "Precision: ", VirtualDOM.createVirtualElement("span", null, fmtVal(enemy.accuracy))), enemy.chanceToHit ? VirtualDOM.createVirtualElement("p", {
        className: 'note'
      }, "Hit chance: ", VirtualDOM.createVirtualElement("span", null, fmtVal(100 * enemy.chanceToHit)), "%") : null), VirtualDOM.createVirtualElement("div", {
        className: 'flex-block padded'
      }, VirtualDOM.createVirtualElement("p", null, "Evasion: ", VirtualDOM.createVirtualElement("span", null, fmtVal(enemy.evasion))), enemy.chanceToEvade ? VirtualDOM.createVirtualElement("p", {
        className: 'note'
      }, "Evade chance: ", VirtualDOM.createVirtualElement("span", null, fmtVal(100 * enemy.chanceToEvade)), "%") : null), VirtualDOM.createVirtualElement("div", {
        className: 'flex-block padded'
      }, VirtualDOM.createVirtualElement("p", null, "Crit. Chance: ", VirtualDOM.createVirtualElement("span", null, fmtVal(100 * enemy.critChance), "%")), VirtualDOM.createVirtualElement("p", null, "Crit. Mult: ", VirtualDOM.createVirtualElement("span", null, "x", fmtVal(enemy.critMult))))) : VirtualDOM.createVirtualElement("div", {
        className: "side enemy"
      })));
    };
    const Battle = () => {
      const map = State.queryState('game.battle.map', {});
      const fight = State.queryState('game.battle.fight', {});
      const isBuildingUnlocked = State.queryState('game.general.buildingUnlocked');
      return VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement(MapInfo, {
        map: { ...map
        },
        isBuildingUnlocked: isBuildingUnlocked
      }), VirtualDOM.createVirtualElement(Fight, {
        fight: fight,
        map: { ...map
        }
      }));
    };

    var css_248z$6 = "\r\n.settings-wrap {\r\n    background: #030304;\r\n    padding: 20px;\r\n}\r\n\r\n.sett-inner {\r\n    max-width: 500px;\r\n}\r\n\r\n#save-text {\r\n    width: 400px;\r\n    margin-bottom: 10px;\r\n    resize: none;\r\n    /*width: 0;\r\n    height: 0;\r\n    padding: 0;\r\n    margin: 0;\r\n    border: 0;*/\r\n}\r\n\r\n.options .row {\r\n    display: flex;\r\n}\r\n\r\n.options .row .set-title {\r\n    width: 300px;\r\n}";
    styleInject(css_248z$6);

    const switchSetting$1 = (path, value) => {
      console.log('changeSetting: ', path, value);
      ColibriClient.sendToWorker('change_setting', {
        path,
        value
      });
    };

    const saveToBuffer = () => {
      ColibriClient.sendToWorker('export_game', {
        cb: 'export_to_buffer'
      });
    };

    const saveToFile = () => {
      ColibriClient.sendToWorker('export_game', {
        cb: 'export_to_file'
      });
    };

    ColibriClient.on('set_settings_state', payload => {
      State.setState('game.settings', payload);
    });

    const uploadFile = e => {
      if (e.target.files && e.target.files[0]) {
        var myFile = e.target.files[0];
        var reader = new FileReader();
        reader.addEventListener('load', function (evt) {
          let data = evt.target.result;
          console.log('importing: ', data);
          ColibriClient.sendToWorker('import_game', data);
        });
        reader.readAsBinaryString(myFile);
      }
    };

    const togglePressSelector = (path, toggle) => {
      if (toggle) {
        State.setState('game.ui.selectKey', path);
      } else {
        State.setState('game.ui.selectKey', false);
      }
    };

    ColibriClient.on('export_to_buffer', payload => {
      console.log('payload_to_clip: ', payload);
      document.getElementById('save-text').innerText = payload;
      document.getElementById('save-text').select();
      document.execCommand('copy');
    });
    ColibriClient.on('export_to_file', payload => {
      const file = new Blob([payload], {
        type: 'text/plain'
      });
      var a = document.createElement("a");
      a.href = window.URL.createObjectURL(file);
      a.download = `idlemancery-${new Date().toISOString()}.txt`;
      a.click();
    });
    const Switcher = ({
      path,
      value
    }) => VirtualDOM.createVirtualElement("p", {
      className: 'popup-link',
      onClick: useCiCallback((path, value) => switchSetting$1(path, value), [path, !value])
    }, value ? 'On' : 'Off');
    const KeyControl = ({
      path,
      value,
      isPress
    }) => VirtualDOM.createVirtualElement("p", {
      className: 'popup-link',
      onClick: useCiCallback((path, isPress) => togglePressSelector(path, isPress), [path, !isPress])
    }, isPress ? 'Press key' : value ? `${value.ctrlKey ? 'Ctrl+' : ''}${value.shiftKey ? 'Shift+' : ''}${value.altKey ? 'Alt+' : ''}${value.key ? value.key : ''}` : 'Not assigned');
    const GameSettings = ({
      settings,
      keySelect,
      unlocks,
      resourcesUnlocked
    }) => {
      return VirtualDOM.createVirtualElement("div", {
        className: 'options'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'section'
      }, VirtualDOM.createVirtualElement("h5", null, "Notifications Settings"), unlocks.creatures ? VirtualDOM.createVirtualElement("div", {
        className: 'row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'set-title'
      }, VirtualDOM.createVirtualElement("p", null, "Show notification when creature dies")), VirtualDOM.createVirtualElement("div", {
        className: 'set-setting'
      }, VirtualDOM.createVirtualElement(Switcher, {
        path: 'notificationsSettings.whenCreatureDies',
        value: settings.notificationsSettings?.whenCreatureDies
      }))) : null, unlocks.battle ? VirtualDOM.createVirtualElement("div", {
        className: 'row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'set-title'
      }, VirtualDOM.createVirtualElement("p", null, "Show notification when zone finished")), VirtualDOM.createVirtualElement("div", {
        className: 'set-setting'
      }, VirtualDOM.createVirtualElement(Switcher, {
        path: 'notificationsSettings.whenZoneFinished',
        value: settings.notificationsSettings?.whenZoneFinished
      }))) : null, unlocks.battle ? VirtualDOM.createVirtualElement("div", {
        className: 'row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'set-title'
      }, VirtualDOM.createVirtualElement("p", null, "Show notification when battle lost")), VirtualDOM.createVirtualElement("div", {
        className: 'set-setting'
      }, VirtualDOM.createVirtualElement(Switcher, {
        path: 'notificationsSettings.whenBattleLost',
        value: settings.notificationsSettings?.whenBattleLost
      }))) : null, unlocks.battle ? VirtualDOM.createVirtualElement("div", {
        className: 'row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'set-title'
      }, VirtualDOM.createVirtualElement("p", null, "Show notification when battle won")), VirtualDOM.createVirtualElement("div", {
        className: 'set-setting'
      }, VirtualDOM.createVirtualElement(Switcher, {
        path: 'notificationsSettings.whenBattleWon',
        value: settings.notificationsSettings?.whenBattleWon
      }))) : null, unlocks.building ? VirtualDOM.createVirtualElement("div", {
        className: 'row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'set-title'
      }, VirtualDOM.createVirtualElement("p", null, "Show notification when building built")), VirtualDOM.createVirtualElement("div", {
        className: 'set-setting'
      }, VirtualDOM.createVirtualElement(Switcher, {
        path: 'notificationsSettings.whenBuildingBuilt',
        value: settings.notificationsSettings?.whenBuildingBuilt
      }))) : null), VirtualDOM.createVirtualElement("div", {
        className: 'section'
      }, VirtualDOM.createVirtualElement("h5", null, "Confirmation Settings"), unlocks.creatures ? VirtualDOM.createVirtualElement("div", {
        className: 'row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'set-title'
      }, VirtualDOM.createVirtualElement("p", null, "Show confirmation when go negative balance after assign creature jobs")), VirtualDOM.createVirtualElement("div", {
        className: 'set-setting'
      }, VirtualDOM.createVirtualElement(Switcher, {
        path: 'confirmationSettings.whenGoNegative',
        value: settings.confirmationSettings?.whenGoNegative
      }))) : null, VirtualDOM.createVirtualElement("div", {
        className: 'row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'set-title'
      }, VirtualDOM.createVirtualElement("p", null, "Show confirmation when go negative balance after assign skill efforts")), VirtualDOM.createVirtualElement("div", {
        className: 'set-setting'
      }, VirtualDOM.createVirtualElement(Switcher, {
        path: 'confirmationSettings.whenSkillsNegative',
        value: settings.confirmationSettings?.whenSkillsNegative
      })))), VirtualDOM.createVirtualElement("div", {
        className: 'section'
      }, VirtualDOM.createVirtualElement("h5", null, "Display resources at sidebar"), resourcesUnlocked.map(resource => {
        return VirtualDOM.createVirtualElement("div", {
          className: 'row'
        }, VirtualDOM.createVirtualElement("div", {
          className: 'set-title'
        }, VirtualDOM.createVirtualElement("p", null, resource.name)), VirtualDOM.createVirtualElement("div", {
          className: 'set-setting'
        }, VirtualDOM.createVirtualElement(Switcher, {
          path: `resourcesDisplay.${resource.id}`,
          value: settings.resourcesDisplay?.[resource.id]
        })));
      })), VirtualDOM.createVirtualElement("div", {
        className: 'section'
      }, VirtualDOM.createVirtualElement("h5", null, "Input controls"), unlocks.creatures ? VirtualDOM.createVirtualElement("div", {
        className: 'row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'set-title'
      }, VirtualDOM.createVirtualElement("p", null, "Show input on creature jobs page as")), VirtualDOM.createVirtualElement("div", {
        className: 'set-setting'
      }, VirtualDOM.createVirtualElement("select", {
        onChange: useCiCallback((path, e) => switchSetting$1(path, e.target.value), ['inputControls.creatureJobs'])
      }, VirtualDOM.createVirtualElement("option", {
        value: 'buttons',
        selected: settings.inputControls?.creatureJobs === 'buttons'
      }, "Buttons"), VirtualDOM.createVirtualElement("option", {
        value: 'slider',
        selected: settings.inputControls?.creatureJobs === 'slider'
      }, "Slider"), VirtualDOM.createVirtualElement("option", {
        value: 'both',
        selected: settings.inputControls?.creatureJobs === 'both'
      }, "Both")))) : null, VirtualDOM.createVirtualElement("div", {
        className: 'row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'set-title'
      }, VirtualDOM.createVirtualElement("p", null, "Show input on learning page as")), VirtualDOM.createVirtualElement("div", {
        className: 'set-setting'
      }, VirtualDOM.createVirtualElement("select", {
        onChange: useCiCallback((path, e) => switchSetting$1(path, e.target.value), ['inputControls.learning'])
      }, VirtualDOM.createVirtualElement("option", {
        value: 'buttons',
        selected: settings.inputControls?.learning === 'buttons'
      }, "Buttons"), VirtualDOM.createVirtualElement("option", {
        value: 'slider',
        selected: settings.inputControls?.learning === 'slider'
      }, "Slider"), VirtualDOM.createVirtualElement("option", {
        value: 'both',
        selected: settings.inputControls?.learning === 'both'
      }, "Both"))))), VirtualDOM.createVirtualElement("div", {
        className: 'section'
      }, VirtualDOM.createVirtualElement("h5", null, "Hotkeys"), VirtualDOM.createVirtualElement("div", {
        className: 'row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'set-title'
      }, VirtualDOM.createVirtualElement("p", null, "Switch to actions tab")), VirtualDOM.createVirtualElement("div", {
        className: 'set-setting'
      }, VirtualDOM.createVirtualElement(KeyControl, {
        path: 'hotKeys.tab_actions',
        value: settings.hotKeys?.tab_actions,
        isPress: keySelect === 'hotKeys.tab_actions'
      }))), VirtualDOM.createVirtualElement("div", {
        className: 'row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'set-title'
      }, VirtualDOM.createVirtualElement("p", null, "Switch to shop tab")), VirtualDOM.createVirtualElement("div", {
        className: 'set-setting'
      }, VirtualDOM.createVirtualElement(KeyControl, {
        path: 'hotKeys.tab_shop',
        value: settings.hotKeys?.tab_shop,
        isPress: keySelect === 'hotKeys.tab_shop'
      }))), VirtualDOM.createVirtualElement("div", {
        className: 'row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'set-title'
      }, VirtualDOM.createVirtualElement("p", null, "Switch to learning tab")), VirtualDOM.createVirtualElement("div", {
        className: 'set-setting'
      }, VirtualDOM.createVirtualElement(KeyControl, {
        path: 'hotKeys.tab_learning',
        value: settings.hotKeys?.tab_learning,
        isPress: keySelect === 'hotKeys.tab_learning'
      }))), unlocks.creatures ? VirtualDOM.createVirtualElement("div", {
        className: 'row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'set-title'
      }, VirtualDOM.createVirtualElement("p", null, "Switch to creatures tab")), VirtualDOM.createVirtualElement("div", {
        className: 'set-setting'
      }, VirtualDOM.createVirtualElement(KeyControl, {
        path: 'hotKeys.tab_creatures',
        value: settings.hotKeys?.tab_creatures,
        isPress: keySelect === 'hotKeys.tab_creatures'
      }))) : null, unlocks.research ? VirtualDOM.createVirtualElement("div", {
        className: 'row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'set-title'
      }, VirtualDOM.createVirtualElement("p", null, "Switch to research tab")), VirtualDOM.createVirtualElement("div", {
        className: 'set-setting'
      }, VirtualDOM.createVirtualElement(KeyControl, {
        path: 'hotKeys.tab_research',
        value: settings.hotKeys?.tab_research,
        isPress: keySelect === 'hotKeys.tab_research'
      }))) : null, unlocks.battle ? VirtualDOM.createVirtualElement("div", {
        className: 'row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'set-title'
      }, VirtualDOM.createVirtualElement("p", null, "Switch to battle tab")), VirtualDOM.createVirtualElement("div", {
        className: 'set-setting'
      }, VirtualDOM.createVirtualElement(KeyControl, {
        path: 'hotKeys.tab_battle',
        value: settings.hotKeys?.tab_shop,
        isPress: keySelect === 'hotKeys.tab_battle'
      }))) : null, unlocks.heirlooms ? VirtualDOM.createVirtualElement("div", {
        className: 'row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'set-title'
      }, VirtualDOM.createVirtualElement("p", null, "Switch to heirlooms tab")), VirtualDOM.createVirtualElement("div", {
        className: 'set-setting'
      }, VirtualDOM.createVirtualElement(KeyControl, {
        path: 'hotKeys.tab_heirlooms',
        value: settings.hotKeys?.tab_heirlooms,
        isPress: keySelect === 'hotKeys.tab_heirlooms'
      }))) : null, VirtualDOM.createVirtualElement("div", {
        className: 'row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'set-title'
      }, VirtualDOM.createVirtualElement("p", null, "Switch to story tab")), VirtualDOM.createVirtualElement("div", {
        className: 'set-setting'
      }, VirtualDOM.createVirtualElement(KeyControl, {
        path: 'hotKeys.tab_story',
        value: settings.hotKeys?.tab_story,
        isPress: keySelect === 'hotKeys.tab_story'
      }))), unlocks.building ? VirtualDOM.createVirtualElement("div", {
        className: 'row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'set-title'
      }, VirtualDOM.createVirtualElement("p", null, "Switch to buildings tab")), VirtualDOM.createVirtualElement("div", {
        className: 'set-setting'
      }, VirtualDOM.createVirtualElement(KeyControl, {
        path: 'hotKeys.tab_building',
        value: settings.hotKeys?.tab_building,
        isPress: keySelect === 'hotKeys.tab_building'
      }))) : null, VirtualDOM.createVirtualElement("div", {
        className: 'row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'set-title'
      }, VirtualDOM.createVirtualElement("p", null, "Switch to settings tab")), VirtualDOM.createVirtualElement("div", {
        className: 'set-setting'
      }, VirtualDOM.createVirtualElement(KeyControl, {
        path: 'hotKeys.tab_settings',
        value: settings.hotKeys?.tab_settings,
        isPress: keySelect === 'hotKeys.tab_settings'
      }))), unlocks.creatures ? VirtualDOM.createVirtualElement("div", {
        className: 'row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'set-title'
      }, VirtualDOM.createVirtualElement("p", null, "Summon creatures")), VirtualDOM.createVirtualElement("div", {
        className: 'set-setting'
      }, VirtualDOM.createVirtualElement(KeyControl, {
        path: 'hotKeys.summon',
        value: settings.hotKeys?.summon,
        isPress: keySelect === 'hotKeys.summon'
      }))) : null, unlocks.creatures ? VirtualDOM.createVirtualElement("div", {
        className: 'row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'set-title'
      }, VirtualDOM.createVirtualElement("p", null, "Summon max creatures")), VirtualDOM.createVirtualElement("div", {
        className: 'set-setting'
      }, VirtualDOM.createVirtualElement(KeyControl, {
        path: 'hotKeys.summon_max',
        value: settings.hotKeys?.summon_max,
        isPress: keySelect === 'hotKeys.summon_max'
      }))) : null));
    };
    const ImportExport = () => VirtualDOM.createVirtualElement("div", {
      className: 'sett-inner'
    }, VirtualDOM.createVirtualElement("div", {
      className: 'flex-block'
    }, VirtualDOM.createVirtualElement("p", null, "Export game"), VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement("textarea", {
      id: 'save-text'
    }), VirtualDOM.createVirtualElement("div", {
      className: 'flex-block'
    }, VirtualDOM.createVirtualElement("button", {
      className: 'main-action',
      onClick: saveToBuffer
    }, "Copy to clipboard"), VirtualDOM.createVirtualElement("button", {
      className: 'main-action',
      onClick: saveToFile
    }, "Download as file")))), VirtualDOM.createVirtualElement("div", {
      className: 'flex-block'
    }, VirtualDOM.createVirtualElement("p", null, "Import game"), VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement("input", {
      type: 'file',
      className: 'upload-file',
      onChange: uploadFile
    }))));
    const Settings = () => {
      const settings = State.queryState('game.settings', {});
      const keySelect = State.queryState('game.ui.selectKey', false);
      const resourcesUnlocked = State.queryState('game.resources', []).filter(one => one.isUnlocked);
      const general = State.queryState('game.general', {});
      const unlocks = {
        creatures: resourcesUnlocked.some(one => one.id === 'souls'),
        banners: general.bannersUnlocked,
        research: general.researchUnlocked,
        battle: general.battleUnlocked,
        building: general.buildingUnlocked,
        heirlooms: general.heirloomsUnlocked
      };
      return VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement("div", {
        className: 'settings-wrap'
      }, VirtualDOM.createVirtualElement(ImportExport, null)), VirtualDOM.createVirtualElement("div", {
        className: 'settings-wrap'
      }, VirtualDOM.createVirtualElement(GameSettings, {
        settings: settings,
        keySelect: keySelect,
        unlocks: unlocks,
        resourcesUnlocked: resourcesUnlocked
      })));
    };

    var css_248z$5 = "\n.story-row {\n    background: #030304;\n    padding: 20px;\n    margin: 10px;\n}\n\n.goal-title {\n    font-weight: bold;\n}";
    styleInject(css_248z$5);

    ColibriClient.on('set_story_state', payload => {
      State.setState('game.story.data', payload);
    });
    const StoryItems = ({
      data,
      expanded
    }) => {
      return VirtualDOM.createVirtualElement("div", {
        className: 'story-container'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'story-rows'
      }, data ? data.map((one, index) => VirtualDOM.createVirtualElement("div", {
        className: 'story-row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'story-name'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'story-title flex'
      }, VirtualDOM.createVirtualElement("p", null, one.name), VirtualDOM.createVirtualElement("p", {
        className: 'popup-link',
        onClick: useCiCallback((id, isExpanded) => {
          State.setState(`game.story.expanded.${id}`, !isExpanded);
        }, [one.id, expanded?.[one.id]])
      }, expanded?.[one.id] ? 'Collapse' : 'Expand')), expanded?.[one.id] ? VirtualDOM.createVirtualElement("div", {
        className: 'desc'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'descriptions'
      }, one.text ? one.text.map(one => VirtualDOM.createVirtualElement("p", null, one)) : VirtualDOM.createVirtualElement("p", null, "No data")), one.note ? VirtualDOM.createVirtualElement("p", {
        className: 'note'
      }, one.note) : null) : null), VirtualDOM.createVirtualElement("div", {
        className: 'requirements'
      }, VirtualDOM.createVirtualElement("p", {
        className: 'goal-title'
      }, "Goal:"), VirtualDOM.createVirtualElement("p", null, one.requirementDesc)))) : VirtualDOM.createVirtualElement("p", null, "No story available")));
    };
    const StoryPage = () => {
      const data = State.queryState('game.story.data', []);
      const expanded = State.queryState('game.story.expanded', {});
      return VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement(StoryItems, {
        data: data,
        expanded: { ...expanded
        }
      }));
    };

    var css_248z$4 = ".queue-wrap {\r\n    padding: 10px;\r\n    background: #030304;\r\n    margin-bottom: 10px;\r\n    overflow-y: auto;\r\n    height: 170px;\r\n}\r\n\r\n.queue-flex {\r\n    display: flex;\r\n    justify-content: flex-start;\r\n    flex-wrap: wrap;\r\n\r\n}\r\n\r\n.queue-flex .summary {\r\n    padding: 10px;\r\n    height: 120px;\r\n}\r\n\r\n.build-item {\r\n    padding: 10px;\r\n    width: 120px;\r\n    height: 120px;\r\n}\r\n\r\n.buildings {\r\n    padding: 10px;\r\n    background: #030304;\r\n}\r\n\r\n.building-wrapper {\r\n    padding: 10px;\r\n}\r\n\r\n.build-wrap {\r\n    width: 150px;\r\n}\r\n\r\n.building-wrapper .description {\r\n    width: 400px;\r\n}\r\n\r\n.embed-block {\r\n    margin-top: 10px;\r\n}\r\n\r\n.embed-block .embed-cost {\r\n    display: flex;\r\n    align-items: center;\r\n}\r\n\r\n.embed-block .embed-cost .tit {\r\n    margin-right: 5px;\r\n}";
    styleInject(css_248z$4);

    const doBuild = id => {
      console.log('do build', id);
      ColibriClient.sendToWorker('do_build', {
        id
      });
    };

    const doEmbedMemory = id => {
      console.log('do embed', id);
      ColibriClient.sendToWorker('embed_memory', {
        id
      });
    };

    const cancelBuild = index => {
      console.log('cancel build', index);
      ColibriClient.sendToWorker('cancel_build', {
        index
      });
    };

    const selectCategory = cat => {
      State.setState('game.buildings.category', cat);
    };

    ColibriClient.on('set_buildings_state', payload => {
      State.setState('game.buildings.data', payload.list);
      State.setState('game.buildings.queue', payload.queue);
      State.setState('game.buildings.maxQueue', payload.maxQueue);
      State.setState('game.buildings.timeQueued', payload.timeQueued);
    });
    const BuildingsComponent = ({
      buildings,
      categories,
      selectedCat,
      isFull
    }) => VirtualDOM.createVirtualElement("div", {
      className: 'buildings'
    }, VirtualDOM.createVirtualElement("div", {
      className: 'building-settings flex'
    }, VirtualDOM.createVirtualElement("div", null), VirtualDOM.createVirtualElement("div", {
      className: 'categories'
    }, categories.map(one => {
      return VirtualDOM.createVirtualElement("p", {
        className: `popup-link ${one === selectedCat ? 'selected' : ''}`,
        onClick: useCiCallback(cat => selectCategory(cat), [one])
      }, one);
    }))), buildings ? buildings.map(one => VirtualDOM.createVirtualElement("div", {
      className: 'building-wrapper flex',
      id: `building-wrapper-${one.id}`
    }, VirtualDOM.createVirtualElement("div", {
      className: 'description'
    }, VirtualDOM.createVirtualElement("h5", null, one.name, " [", one.level, " ", `${one.max ? `/ ${one.max}` : ``}`, "]"), VirtualDOM.createVirtualElement("p", null, one.description)), VirtualDOM.createVirtualElement("div", {
      className: 'costs',
      id: `cost-${one.id}`
    }, VirtualDOM.createVirtualElement("p", {
      className: 'cost-title'
    }, "Costs:"), VirtualDOM.createVirtualElement(ResourcesList, {
      data: one.cost
    }), VirtualDOM.createVirtualElement("p", {
      className: 'time'
    }, "Time: ", one.timeFmt)), VirtualDOM.createVirtualElement("div", {
      className: 'build-wrap'
    }, VirtualDOM.createVirtualElement("button", {
      className: 'main-action',
      onClick: useCiCallback(id => doBuild(id), [one.id]),
      disabled: !one.isAvailable || isFull || !one.isUnlocked
    }, "Build"), one.isEmbedMemoryStoneUnlocked ? VirtualDOM.createVirtualElement("div", {
      className: 'embed-block'
    }, one.memoryEmbedded ? VirtualDOM.createVirtualElement("p", null, `Will save ${one.memoryEmbedded} levels on next reset`) : null, one.embedMemoryStoneCost ? VirtualDOM.createVirtualElement("p", {
      className: 'embed-cost'
    }, VirtualDOM.createVirtualElement("span", {
      className: 'tit'
    }, "Embed memory: "), VirtualDOM.createVirtualElement(ResourceIcon, {
      id: 'memoryStones'
    }), one.embedMemoryStoneCost) : null, VirtualDOM.createVirtualElement("button", {
      className: 'main-action',
      onClick: useCiCallback(id => doEmbedMemory(id), [one.id]),
      disabled: !one.embedMemoryStoneAvailable
    }, "Embed")) : null))) : VirtualDOM.createVirtualElement("p", null, "No buildings available"));
    const BuildingQueue = ({
      queue,
      maxQueue,
      timeQueued
    }) => VirtualDOM.createVirtualElement("div", {
      className: 'queue-wrap'
    }, VirtualDOM.createVirtualElement("div", {
      className: 'queue-flex'
    }, VirtualDOM.createVirtualElement("div", {
      className: 'summary'
    }, VirtualDOM.createVirtualElement("p", null, "Building queue: ", queue.length, " of ", maxQueue), VirtualDOM.createVirtualElement("p", null, timeQueued)), queue.map((item, index) => VirtualDOM.createVirtualElement("div", {
      className: 'build-item'
    }, VirtualDOM.createVirtualElement("p", null, item.name, " (", item.level, ")"), VirtualDOM.createVirtualElement("p", null, "Time: ", item.timeFmt), !item.isPurchased ? VirtualDOM.createVirtualElement("button", {
      className: 'main-action danger',
      onClick: useCiCallback(index => cancelBuild(index), [index])
    }, "Cancel") : null))));
    const Buildings = () => {
      const buildings = State.queryState('game.buildings.data', []);
      const queue = State.queryState('game.buildings.queue', []);
      const maxQueue = State.queryState('game.buildings.maxQueue', 0);
      const timeQueued = State.queryState('game.buildings.timeQueued', '00:00:00');
      const selectedCat = State.queryState('game.buildings.category', 'All');
      const byCats = {
        All: []
      };
      buildings?.filter(one => one.isUnlocked || one.level)?.forEach(one => {
        byCats.All.push(one);

        if (!byCats[one.category]) {
          byCats[one.category] = [];
        }

        byCats[one.category].push(one);
      });
      const categories = Object.keys(byCats);
      return VirtualDOM.createVirtualElement("div", {
        className: 'building-page'
      }, VirtualDOM.createVirtualElement(BuildingQueue, {
        queue: queue,
        maxQueue: maxQueue,
        timeQueued: timeQueued
      }), VirtualDOM.createVirtualElement(BuildingsComponent, {
        buildings: byCats[selectedCat],
        categories: categories,
        selectedCat: selectedCat,
        isFull: maxQueue <= queue.length
      }));
    };

    var css_248z$3 = ".heirlooms-page {\r\n    padding: 0 10px 10px;\r\n}\r\n\r\n.description-container {\r\n    padding: 20px;\r\n}\r\n\r\n.flex-heirlooms {\r\n    display: flex;\r\n    justify-content: space-between;\r\n}\r\n\r\n.flex-heirlooms .items-container {\r\n    flex: 1;\r\n    margin-right: 20px;\r\n    background: #030304;\r\n    padding: 10px;\r\n}\r\n\r\n.heirlooms-inventory {\r\n    background: #030304;\r\n    padding: 10px;\r\n    margin-top: 20px;\r\n}\r\n\r\n.heirlooms-page .description-container {\r\n    background: #030304;\r\n    max-width: 330px;\r\n}\r\n\r\n.heirlooms-row {\r\n    display: flex;\r\n    flex-wrap: wrap;\r\n    justify-content: flex-start;\r\n}\r\n\r\n.heirloom-slot {\r\n    padding: 5px;\r\n    width: 280px;\r\n    height: 220px;\r\n    border: 2px solid #333;\r\n    background: #030914;\r\n    margin: 5px;\r\n}\r\n\r\n.heirloom-slot.collapsed {\r\n    height: 50px;\r\n}\r\n.heirloom-slot.collapsed .cross:hover {\r\n    color: #613169;\r\n}\r\n\r\n\r\n.heirloom-slot.collapsed .cross {\r\n    color: #aaaaaa;\r\n    position: absolute;\r\n    right: 5px;\r\n    top: 5px;\r\n    cursor: pointer;\r\n}\r\n\r\n.heirloom-slot.selected {\r\n    border: 2px solid #613169;\r\n}\r\n\r\n\r\n.heirloom-item {\r\n    width: 100%;\r\n    height: 100%;\r\n    padding: 0px;\r\n    position: relative;\r\n}\r\n\r\n.collapsed .heirloom-item .title {\r\n    padding-right: 20px;\r\n}\r\n\r\n.heirloom-item .title {\r\n    font-weight: bold;\r\n    margin: 0;\r\n}\r\n\r\n.heirloom-item .tier-1 {\r\n    color: #7191d9;\r\n}\r\n\r\n.heirloom-item .tier-2 {\r\n    color: #d1c119;\r\n}\r\n\r\n.heirloom-item .title.tier-3 {\r\n    color: #f17119;\r\n}\r\n\r\n.heirloom-item .title.tier-4 {\r\n    color: #41e119;\r\n}\r\n\r\n.heirloom-item .title.tier-5 {\r\n    color: #f12149;\r\n}\r\n\r\n.heirloom-item button {\r\n    bottom: 5px;\r\n    width: 180px;\r\n    position: absolute;\r\n}\r\n";
    styleInject(css_248z$3);

    const drop = (key, index) => {
      ColibriClient.sendToWorker('drop_heirloom', {
        fromKey: key,
        fromIndex: index
      });
    };

    const setMinTier$1 = tierId => {
      console.log('change_heirloom_mintier', {
        tierId: +tierId
      });
      ColibriClient.sendToWorker('change_heirloom_mintier', {
        tierId: +tierId
      });
    };

    const setExpanded = expanded => {
      State.setState('game.heirlooms.expanded', expanded);
    };

    const select = (key, index) => {
      const selection = State.queryState('game.heirlooms.selected');

      if (!selection) {
        State.setState('game.heirlooms.selected', {
          key,
          index
        });
      } else if (selection.key === key && selection.index === index) {
        State.setState('game.heirlooms.selected', null);
      } else {
        ColibriClient.sendToWorker('move_heirlooms', {
          fromKey: selection.key,
          fromIndex: selection.index,
          toKey: key,
          toIndex: index
        });
        State.setState('game.heirlooms.selected', null);
      }
    };

    ColibriClient.on('set_heirlooms_state', payload => {
      State.setState('game.heirlooms.data', payload);
    });
    const HeirloomsRow = ({
      items,
      selected,
      key,
      expanded
    }) => VirtualDOM.createVirtualElement("div", {
      className: 'heirlooms-row'
    }, items ? items.map((one, index) => VirtualDOM.createVirtualElement("div", {
      className: `heirloom-slot ${selected && selected.key === key && selected.index === index ? 'selected' : ''}
         ${!expanded ? 'collapsed' : ''}`,
      onClick: useCiCallback((key, index) => select(key, index), [key, index])
    }, items[index] ? VirtualDOM.createVirtualElement("div", {
      className: 'heirloom-item'
    }, VirtualDOM.createVirtualElement("p", {
      className: `title tier-${items[index].tier}`
    }, items[index].name), expanded ? VirtualDOM.createVirtualElement("div", {
      className: 'bonuses'
    }, items[index].bonuses.map(one => VirtualDOM.createVirtualElement("p", null, one.text))) : null, expanded ? VirtualDOM.createVirtualElement("button", {
      className: 'main-action',
      onClick: useCiCallback((key, index) => drop(key, index), [key, index])
    }, "Drop item") : VirtualDOM.createVirtualElement("span", {
      className: 'cross',
      onClick: useCiCallback((key, index) => drop(key, index), [key, index])
    }, "X")) : null)) : VirtualDOM.createVirtualElement("p", null, "No actions available"));
    const HeirloomDetails = ({
      expanded,
      selectedItem
    }) => VirtualDOM.createVirtualElement("div", {
      className: 'description-container'
    }, VirtualDOM.createVirtualElement("p", {
      className: 'description'
    }, "Heirlooms are given when you win battles.  To make an heirloom bonus active, select it by clicking on it (once selected it will have a purple border) then click on one of the 'Applied' slots. If the slot you try to put the item in already has an item item in it, the item inside the slot will be moved to the inventory"), VirtualDOM.createVirtualElement("p", {
      className: 'popup-link',
      onClick: useCiCallback(expanded => setExpanded(!expanded), [expanded])
    }, expanded ? 'Collapse items' : 'Expand items'), VirtualDOM.createVirtualElement("div", {
      className: 'heirloom-slot'
    }, selectedItem ? VirtualDOM.createVirtualElement("div", {
      className: 'heirloom-item'
    }, VirtualDOM.createVirtualElement("p", {
      className: `title tier-${selectedItem.tier}`
    }, selectedItem.name), VirtualDOM.createVirtualElement("div", {
      className: 'bonuses'
    }, selectedItem.bonuses.map(one => VirtualDOM.createVirtualElement("p", null, one.text)))) : VirtualDOM.createVirtualElement("p", null, "Select item")));
    const HeirloomsFilters = ({
      lootFilterTier
    }) => VirtualDOM.createVirtualElement("div", {
      className: 'flex-block'
    }, VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement("p", null, "Set minimum tier drop filter"), VirtualDOM.createVirtualElement("select", {
      onChange: useCiCallback(e => setMinTier$1(e.target.value))
    }, VirtualDOM.createVirtualElement("option", {
      value: 0,
      selected: lootFilterTier === 0
    }, "All"), VirtualDOM.createVirtualElement("option", {
      value: 1,
      selected: lootFilterTier === 1
    }, "Empowered"), VirtualDOM.createVirtualElement("option", {
      value: 2,
      selected: lootFilterTier === 2
    }, "Rare"), VirtualDOM.createVirtualElement("option", {
      value: 3,
      selected: lootFilterTier === 3
    }, "Epic"))));
    const Heirlooms = () => {
      const selection = State.queryState('game.heirlooms.selected');
      const data = State.queryState('game.heirlooms.data', {});
      const expanded = State.queryState('game.heirlooms.expanded', false);
      let selectedItem = null;

      if (selection) {
        selectedItem = data[selection.key]?.[selection.index];
      }

      return VirtualDOM.createVirtualElement("div", {
        className: 'heirlooms-page'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'flex-heirlooms'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'items-container'
      }, VirtualDOM.createVirtualElement("h4", null, "Applied"), VirtualDOM.createVirtualElement("p", null, "Items here have impact on game"), VirtualDOM.createVirtualElement(HeirloomsRow, {
        items: data.applied,
        selected: selection,
        key: 'applied',
        expanded: true
      }), VirtualDOM.createVirtualElement("h4", null, "Stored"), VirtualDOM.createVirtualElement("p", null, "Items here persist through resets"), VirtualDOM.createVirtualElement(HeirloomsRow, {
        items: data.saved,
        selected: selection,
        key: 'saved',
        expanded: expanded
      })), VirtualDOM.createVirtualElement(HeirloomDetails, {
        expanded: expanded,
        selectedItem: selectedItem
      })), VirtualDOM.createVirtualElement("div", {
        className: 'heirlooms-inventory'
      }, VirtualDOM.createVirtualElement("h4", null, "Inventory"), VirtualDOM.createVirtualElement("div", {
        className: 'flex-block'
      }, VirtualDOM.createVirtualElement("p", null, "Items here will be removed after you reset"), VirtualDOM.createVirtualElement(HeirloomsFilters, {
        lootFilterTier: data.filterMinTier
      })), VirtualDOM.createVirtualElement(HeirloomsRow, {
        items: data.inventory,
        selected: selection,
        key: 'inventory',
        expanded: expanded
      })));
    };

    var css_248z$2 = ".aura-container .aura-settings {\r\n    background: #030304;\r\n    padding: 20px;\r\n    margin-bottom: 10px;\r\n}\r\n\r\n.aura-rows {\r\n    background: #030304;\r\n    padding: 20px;\r\n}\r\n\r\n.aura-container .aura-row {\r\n    display: flex;\r\n    justify-content: space-between;\r\n    align-items: center;\r\n}\r\n.aura-container .aura-row > div {\r\n    width: 200px;\r\n}\r\n\r\n.aura-container .aura-row .xp-bar {\r\n    width: 300px;\r\n}\r\n\r\n.aura-container .aura-row .xp-bar .outer-span {\r\n    width: 300px;\r\n}\r\n.aura-container .aura-row .xp-bar .tiny {\r\n    font-size: 12px;\r\n    text-align: right;\r\n    margin: 0;\r\n}\r\n\r\n\r\n.aura-container .aura-row .actions {\r\n    display: block;\r\n}\r\n\r\n.aura-container .aura-row .actions .effort {\r\n    margin: 0 5px;\r\n}\r\n\r\n.learning-slider {\r\n    width: 190px;\r\n}\r\n\r\n.aura-blocks {\r\n    display: flex;\r\n    flex-wrap: wrap;\r\n}\r\n\r\n.aura-block {\r\n    width: 280px;\r\n    background: #030304;\r\n    padding: 10px;\r\n    margin: 5px;\r\n    height: 250px;\r\n}\r\n\r\n.aura-block-inner {\r\n    height: 190px;\r\n}\r\n\r\n.aura-block .actions {\r\n    display: flex;\r\n    justify-content: space-between;\r\n    bottom: 10px;\r\n}\r\n\r\n.aura-title .tier-1 {\r\n    color: #7191d9;\r\n}\r\n\r\n.aura-title .tier-2 {\r\n    color: #d1c119;\r\n}\r\n\r\n.aura-title .tier-3 {\r\n    color: #f17119;\r\n}\r\n\r\n.aura-title .tier-4 {\r\n    color: #71f119;\r\n}\r\n\r\n.quality {\r\n    font-style: italic;\r\n    margin: 15px 0;\r\n}";
    styleInject(css_248z$2);

    const dropAura = index => {
      console.log('dropAura', {
        index
      });
      ColibriClient.sendToWorker('drop_aura', {
        index
      });
    };

    const turnOffAura = index => {
      console.log('toggle_aura', {
        index
      });
      ColibriClient.sendToWorker('toggle_aura', {
        index
      });
    };

    const activateAura = index => {
      console.log('toggle_aura', {
        index
      });
      ColibriClient.sendToWorker('toggle_aura', {
        index
      });
    };

    const changeEfforts = (index, amount) => {
      console.log('change_aura_effort', {
        index,
        effort: amount
      });
      ColibriClient.sendToWorker('change_aura_effort', {
        index,
        effort: +amount / 100
      });
    };

    const setMinQuality = quality => {
      ColibriClient.sendToWorker('change_aura_minquality', {
        quality: +(quality / 100)
      });
    };

    const setMinTier = tierId => {
      console.log('change_aura_mintier', {
        tierId: +tierId
      });
      ColibriClient.sendToWorker('change_aura_mintier', {
        tierId: +tierId
      });
    };

    ColibriClient.on('set_auras_state', payload => {
      State.setState('game.auras.data', payload);
    });
    const ActiveAuras = ({
      auras,
      filter,
      filterQuality
    }) => {
      return VirtualDOM.createVirtualElement("div", {
        className: 'aura-container'
      }, VirtualDOM.createVirtualElement("h2", null, "Active auras"), VirtualDOM.createVirtualElement("div", {
        className: 'aura-settings flex'
      }, VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement("p", null, "By activating aura it becomes used. Also active aura earns some xp once used. XP gain depends on your mana invested into it.")), VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement("p", null, "Set minimum tier drop filter"), VirtualDOM.createVirtualElement("select", {
        onChange: useCiCallback(e => setMinTier(e.target.value))
      }, VirtualDOM.createVirtualElement("option", {
        value: 0,
        selected: filter === 0
      }, "All"), VirtualDOM.createVirtualElement("option", {
        value: 1,
        selected: filter === 1
      }, "Empowered"), VirtualDOM.createVirtualElement("option", {
        value: 2,
        selected: filter === 2
      }, "Rare"), VirtualDOM.createVirtualElement("option", {
        value: 3,
        selected: filter === 3
      }, "Epic"))), VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement("p", null, "Set minimum quality drop filter"), VirtualDOM.createVirtualElement("input", {
        type: 'number',
        onChange: useCiCallback(e => setMinQuality(e.target.value)),
        value: filterQuality * 100 || 0
      }))), VirtualDOM.createVirtualElement("div", {
        className: 'aura-rows'
      }, auras ? auras.map(one => VirtualDOM.createVirtualElement("div", {
        className: `aura-row`,
        id: `aura-row-${one.index}`
      }, VirtualDOM.createVirtualElement("div", {
        className: `aura-title`
      }, VirtualDOM.createVirtualElement("p", {
        className: `tier-${one.tier}`
      }, one.name, " [", one.level, "]")), VirtualDOM.createVirtualElement("div", {
        className: 'description'
      }, VirtualDOM.createVirtualElement("p", {
        className: 'quality'
      }, "Quality: ", fmtVal(100 * one.quality), "%"), one.bonuses.map(bonus => VirtualDOM.createVirtualElement("p", null, bonus.text))), VirtualDOM.createVirtualElement("div", {
        className: 'xp-bar'
      }, VirtualDOM.createVirtualElement("p", {
        className: 'tiny'
      }, fmtVal(one.xp), " / ", fmtVal(one.maxXp), " XP"), VirtualDOM.createVirtualElement(ProgressBar, {
        progress: one.xp,
        max: one.maxXp,
        progressing: one.effort > 0
      })), VirtualDOM.createVirtualElement("div", {
        className: 'actions'
      }, VirtualDOM.createVirtualElement("p", null, "Set mana spent"), VirtualDOM.createVirtualElement("div", {
        className: 'flex'
      }, VirtualDOM.createVirtualElement("span", {
        className: 'effort'
      }, fmtVal(100 * one.effort), "%"), VirtualDOM.createVirtualElement("button", {
        className: 'main-action',
        onClick: useCiCallback(index => turnOffAura(index), [one.index])
      }, "Turn off")), VirtualDOM.createVirtualElement("input", {
        type: 'range',
        className: 'learning-slider',
        name: `workers-${one.index}`,
        min: "0",
        max: `${Math.min(100)}`,
        value: `${one.effort * 100}`,
        onChange: useCiCallback((id, e) => {
          changeEfforts(id, e.target.value);
        }, [one.index])
      })))) : VirtualDOM.createVirtualElement("p", null, "No active auras")));
    };
    const AllAuras = ({
      auras
    }) => {
      return VirtualDOM.createVirtualElement("div", {
        className: 'auras-container'
      }, VirtualDOM.createVirtualElement("h2", null, "All auras"), VirtualDOM.createVirtualElement("div", {
        className: 'aura-blocks'
      }, auras ? auras.map(one => VirtualDOM.createVirtualElement("div", {
        className: `aura-block`,
        id: `aura-row-${one.index}`
      }, VirtualDOM.createVirtualElement("div", {
        className: 'aura-block-inner'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'aura-title'
      }, VirtualDOM.createVirtualElement("p", {
        className: `tier-${one.tier}`
      }, one.name, " [", one.level, "]")), VirtualDOM.createVirtualElement("div", {
        className: 'description'
      }, VirtualDOM.createVirtualElement("p", {
        className: 'quality'
      }, "Quality: ", fmtVal(100 * one.quality), "%"), one.bonuses.map(bonus => VirtualDOM.createVirtualElement("p", null, bonus.text)))), VirtualDOM.createVirtualElement("div", {
        className: 'actions'
      }, VirtualDOM.createVirtualElement("button", {
        className: 'main-action',
        onClick: useCiCallback(index => activateAura(index), [one.index])
      }, "Activate"), VirtualDOM.createVirtualElement("button", {
        className: 'main-action',
        onClick: useCiCallback(index => dropAura(index), [one.index])
      }, "Drop")))) : VirtualDOM.createVirtualElement("p", null, "No active auras")));
    };
    const Auras = () => {
      const auras = State.queryState('game.auras.data.list', []);
      const filter = State.queryState('game.auras.data.filterMinTier', 0);
      const filterQuality = State.queryState('game.auras.data.filterMinQuality', 0);
      const rs = State.queryState('game.resources', []);
      rs.find(one => one.id === 'mana')?.income;
      const activeAuras = auras.filter(one => one.isTurnedOn);
      const allAuras = auras.filter(one => !one.isTurnedOn);
      return VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement(ActiveAuras, {
        auras: activeAuras,
        filter: filter,
        filterQuality: filterQuality
      }), VirtualDOM.createVirtualElement(AllAuras, {
        auras: allAuras
      }));
    };

    const ViewRun = ({
      tabId
    }) => VirtualDOM.createVirtualElement("div", {
      className: 'in-game'
    }, VirtualDOM.createVirtualElement(Sidebar, null), VirtualDOM.createVirtualElement("div", {
      className: 'run-content'
    }, tabId === 'jobs' ? VirtualDOM.createVirtualElement(Jobs, null) : null, tabId === 'shop' ? VirtualDOM.createVirtualElement(Shop, null) : null, tabId === 'creatures' ? VirtualDOM.createVirtualElement(Creatures, null) : null, tabId === 'learning' ? VirtualDOM.createVirtualElement(Learning, null) : null, tabId === 'banners' ? VirtualDOM.createVirtualElement(Banners, null) : null, tabId === 'research' ? VirtualDOM.createVirtualElement(Research, null) : null, tabId === 'battle' ? VirtualDOM.createVirtualElement(Battle, null) : null, tabId === 'heirlooms' ? VirtualDOM.createVirtualElement(Heirlooms, null) : null, tabId === 'building' ? VirtualDOM.createVirtualElement(Buildings, null) : null, tabId === 'auras' ? VirtualDOM.createVirtualElement(Auras, null) : null, tabId === 'story' ? VirtualDOM.createVirtualElement(StoryPage, null) : null, tabId === 'settings' ? VirtualDOM.createVirtualElement(Settings, null) : null));
    const RunScreen = () => {
      const tabId = State.queryState('ui.navigation.page', 'jobs');
      return VirtualDOM.createVirtualElement(ViewRun, {
        tabId: tabId
      });
    };

    const Content = () => VirtualDOM.createVirtualElement(RunScreen, null);

    var css_248z$1 = "h1 {\r\n    padding-left: 20px;\r\n}\r\n\r\nbody * {\r\n    box-sizing: border-box;\r\n}\r\n\r\nbody {\r\n    margin: 0;\r\n    padding: 0;\r\n    background: #121520;\r\n    color: #fff;\r\n    /*font-family: \"Century Gothic\";*/\r\n    font-family: 'Didact Gothic', sans-serif;\r\n    font-size: 13px;\r\n}\r\n\r\np {\r\n    margin-block-start: 0.75em;\r\n    margin-block-end: 0.75em;\r\n}\r\n\r\n.flex {\r\n    display: flex;\r\n    justify-content: space-between;\r\n    align-items: center;\r\n}\r\n\r\nbutton {\r\n    color: #ffffff;\r\n    cursor: pointer;\r\n}\r\n\r\nbutton.main-action.long {\r\n    width: 240px;\r\n}\r\n\r\nbutton.main-action {\r\n    background: linear-gradient(#512159, #613169, #512159);\r\n    padding: 5px 10px;\r\n    border: 1px solid #411149;\r\n    border-radius: 3px;\r\n}\r\n\r\nbutton.main-action:hover {\r\n    background: linear-gradient(#411149, #512159, #411149);\r\n}\r\n\r\nbutton.main-action:disabled {\r\n    background: #130314;\r\n    color: #989\r\n}\r\n\r\n.hint {\r\n    position: fixed;\r\n    bottom: 40px;\r\n    left: 10px;\r\n    background: #000;\r\n    color: #fff;\r\n    padding: 20px;\r\n    font-size: 13px;\r\n    border-radius: 5px;\r\n}\r\n\r\n.modal-wrap {\r\n    position: fixed;\r\n    top: 0;\r\n    left: 0;\r\n    width: 100%;\r\n    height: 100%;\r\n    background: rgba(30,30,30,0.6);\r\n}\r\n\r\n.modal-wrap .modal {\r\n    margin: 10% auto auto;\r\n    width: 50%;\r\n    height: 60%;\r\n    position: relative;\r\n    background: #070814;\r\n    padding: 20px;\r\n}\r\n\r\n.modal-wrap .modal.confirm-modal {\r\n    max-height: 500px;\r\n    min-height: 200px;\r\n}\r\n\r\n.modal-wrap .modal .modal-body {\r\n    overflow-y: scroll;\r\n    height: calc(100% - 90px);\r\n}\r\n\r\n.modal-wrap .modal.confirm-modal .modal-body {\r\n    overflow-y: auto;\r\n}\r\n\r\n.modal-wrap .modal .note {\r\n    font-style: italic;\r\n    color: #aaa;\r\n}\r\n\r\n.modal-wrap .modal .close {\r\n    cursor: pointer;\r\n}\r\n\r\n.resource-item {\r\n    display: flex;\r\n}\r\n\r\n.resource-item .missing {\r\n    color: #ad2121;\r\n}\r\n\r\n.resource-icon-wrap {\r\n    width: 16px;\r\n    height: 16px;\r\n    display: inline-block;\r\n    margin-right: 0.25em;\r\n}\r\n\r\n.icon-wrap img{\r\n    object-fit: contain;\r\n    width: 100%;\r\n}\r\n\r\n.resource-icon-wrap img {\r\n    width: 100%;\r\n    object-fit: contain;\r\n}\r\n\r\n.progress-wrap {\r\n    padding: 0.75em;\r\n}\r\n\r\n.progress-wrap .outer-span {\r\n    background: #121520;\r\n    height: 8px;\r\n    border-radius: 4px;\r\n    border: 1px solid #444;\r\n}\r\n\r\n.progress-wrap .outer-span .inner-span{\r\n    height: 100%;\r\n    border-radius: 4px;\r\n    background: linear-gradient(#713169, #915189, #713169);\r\n}\r\n\r\n.progress-wrap .outer-span.blue .inner-span{\r\n    height: 100%;\r\n    border-radius: 4px;\r\n    background: linear-gradient(#7191b9, #7191d9, #7191b9);\r\n}\r\n\r\n.popup-link {\r\n    color: #f171a9;\r\n    text-decoration: underline;\r\n    cursor: pointer;\r\n    margin-right: 10px;\r\n    margin-left: 10px;\r\n}\r\n\r\n.link {\r\n    color: #f171a9;\r\n    text-decoration: underline;\r\n    cursor: pointer;\r\n}\r\n\r\n.padded {\r\n    margin: 16px 0;\r\n}\r\n\r\n.notifications-wrapper {\r\n    top: 0;\r\n    right: 0;\r\n    position: fixed;\r\n    z-index: 4;\r\n}\r\n\r\n.notifications-wrapper .notification {\r\n    border-radius: 5px;\r\n    padding: 3px 5px;\r\n    margin: 3px;\r\n}\r\n\r\n.confirmation-popup-body .description{\r\n    height: calc(100% - 60px);\r\n}";
    styleInject(css_248z$1);

    const markShown = () => ColibriClient.sendToWorker('do_story_shown');

    const Story = ({
      story
    }) => VirtualDOM.createVirtualElement("div", {
      className: 'modal-wrap'
    }, VirtualDOM.createVirtualElement("div", {
      className: 'modal'
    }, VirtualDOM.createVirtualElement("div", {
      className: 'modal-header'
    }, VirtualDOM.createVirtualElement("h3", null, story.name)), VirtualDOM.createVirtualElement("div", {
      className: 'modal-body'
    }, VirtualDOM.createVirtualElement("div", {
      className: 'descriptions'
    }, story.text ? story.text.map(one => VirtualDOM.createVirtualElement("p", null, one)) : VirtualDOM.createVirtualElement("p", null, "No data")), story.note ? VirtualDOM.createVirtualElement("p", {
      className: 'note'
    }, story.note) : null, VirtualDOM.createVirtualElement("div", {
      className: 'requirements'
    }, VirtualDOM.createVirtualElement("h5", null, "Requirements:"), VirtualDOM.createVirtualElement("p", null, story.requirementDesc))), VirtualDOM.createVirtualElement("div", {
      className: 'modal-footer'
    }, VirtualDOM.createVirtualElement("button", {
      className: 'main-action',
      onClick: markShown
    }, "OK"))));
    const StoryPopup = () => {
      const getShown = State.queryState('game.general.story');
      return getShown ? VirtualDOM.createVirtualElement(Story, {
        story: getShown
      }) : null;
    };

    const MAX_NOTIFICATIONS = 3;
    ColibriClient.on('spawn_notification', ({
      message,
      color = '#6181a9'
    }) => {
      const notifications = State.queryState('game.ui.notifications', []);
      notifications.unshift({
        message,
        color,
        expire: Date.now() + 5000
      });

      if (notifications.length > MAX_NOTIFICATIONS) {
        notifications.pop();
      }

      State.setState('game.ui.notifications', [...notifications]);
    });
    setInterval(() => {
      const notifications = State.queryState('game.ui.notifications', []);
      const newNots = notifications.filter(one => one.expire >= Date.now());
      State.setState('game.ui.notifications', [...newNots]);
    }, 1000);
    const NotificationsUI = ({
      notifications
    }) => VirtualDOM.createVirtualElement("div", {
      className: 'notifications-wrapper'
    }, notifications?.map(one => VirtualDOM.createVirtualElement("div", {
      className: 'notification',
      style: `background-color: ${one.color}`
    }, VirtualDOM.createVirtualElement("p", null, one.message))));
    const Notifications = () => {
      const notifications = State.queryState('game.ui.notifications', []);
      return VirtualDOM.createVirtualElement(NotificationsUI, {
        notifications: [...notifications]
      });
    };

    var css_248z = "\r\n.shop-settings {\r\n    margin: 5px;\r\n    padding: 10px;\r\n    background: #030304;\r\n    display: flex;\r\n    align-items: center;\r\n    justify-content: space-between;\r\n}\r\n\r\n.shop-items {\r\n    display: flex;\r\n    flex-wrap: wrap;\r\n    justify-content: flex-start;\r\n}\r\n\r\n.shop-item-wrapper {\r\n    width: 260px;\r\n    text-align: center;\r\n    margin: 5px;\r\n    padding: 10px;\r\n    background: #030304;\r\n}\r\n\r\n.shop-item-wrapper button {\r\n    margin: auto;\r\n    width: 140px;\r\n}\r\n\r\n.item-resources {\r\n    padding-left: 50px;\r\n}\r\n\r\n.temper-popup {\r\n    width: 80%;\r\n}";
    styleInject(css_248z);

    const selectTemper = id => {
      ColibriClient.sendToWorker('do_select_temper', {
        id
      });
    };

    ColibriClient.on('set_temper_state', payload => {
      State.setState('game.temper.data', payload);
    });
    const TemperPopupUI = ({
      items
    }) => {
      return VirtualDOM.createVirtualElement(Modal, {
        modalId: 'temper',
        title: 'Choose your temper',
        isHideClose: true,
        className: 'temper-popup'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'shop-items'
      }, items ? items.map(one => VirtualDOM.createVirtualElement("div", {
        className: 'shop-item-wrapper'
      }, VirtualDOM.createVirtualElement("h5", null, one.name), VirtualDOM.createVirtualElement("p", null, one.description), VirtualDOM.createVirtualElement("button", {
        className: 'main-action',
        onClick: useCiCallback(id => selectTemper(id), [one.id])
      }, "Select"))) : VirtualDOM.createVirtualElement("p", null, "Loading...")));
    };
    const TemperPopup = () => {
      const isOpened = State.queryState(`game.general.temper.popupShown`);

      if (isOpened) {
        showModal('temper');
      } else {
        if (isModalOpened('temper')) {
          State.setState('game.temper.data', null);
          closeModal('temper');
        }
      }

      const temperData = State.queryState('game.temper.data', null);

      if (isOpened && !temperData) {
        ColibriClient.sendToWorker('get_temper_data');
      }

      return VirtualDOM.createVirtualElement(TemperPopupUI, {
        isOpened: isOpened,
        items: temperData
      });
    };

    const spawnConfirm = action => {
      if (action) {
        ColibriClient.sendToWorker(action.type, action.payload);
      }

      closeConfirm();
    };

    ColibriClient.on('spawn_confirm', payload => {
      State.setState('game.ui.confirm', payload);
    });
    const closeConfirm = () => {
      State.setState('game.ui.confirm', null);
    };
    const ConfirmPopupUI = ({
      confirmState
    }) => {
      return VirtualDOM.createVirtualElement(Modal, {
        modalId: 'confirmation',
        title: 'Are you sure?',
        isHideClose: true,
        className: 'confirm-modal'
      }, confirmState ? VirtualDOM.createVirtualElement("div", {
        className: 'confirmation-popup-body'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'description'
      }, VirtualDOM.createVirtualElement("p", null, confirmState.text)), VirtualDOM.createVirtualElement("div", {
        className: 'flex buttons'
      }, VirtualDOM.createVirtualElement("button", {
        className: 'main-action',
        onClick: useCiCallback(action => spawnConfirm(action), [confirmState.onConfirmAction])
      }, confirmState.buttons?.confirm || 'Continue'), VirtualDOM.createVirtualElement("button", {
        className: 'main-action',
        onClick: useCiCallback(action => spawnConfirm(action), [confirmState.onCancelAction])
      }, confirmState.buttons?.cancel || 'Cancel'))) : null);
    };
    const ConfirmPopup = () => {
      const confirmState = State.queryState(`game.ui.confirm`, null);

      if (!confirmState) {
        closeModal('confirmation');
      } else {
        showModal('confirmation');
      }

      return VirtualDOM.createVirtualElement(ConfirmPopupUI, {
        confirmState: confirmState
      });
    };

    const Game = () => VirtualDOM.createVirtualElement("main", null, VirtualDOM.createVirtualElement(Header, null), VirtualDOM.createVirtualElement(Content, null), VirtualDOM.createVirtualElement(Footer, null), VirtualDOM.createVirtualElement(StoryPopup, null), VirtualDOM.createVirtualElement(Notifications, null), VirtualDOM.createVirtualElement(TemperPopup, null), VirtualDOM.createVirtualElement(ConfirmPopup, null), VirtualDOM.createVirtualElement(Modal, {
      modalId: 'version',
      title: 'Version history'
    }, VirtualDOM.createVirtualElement("div", {
      className: 'version-items'
    }, VirtualDOM.createVirtualElement("h4", null, "Version 0.1.8 (04.12.2022)"), VirtualDOM.createVirtualElement("ul", null, VirtualDOM.createVirtualElement("li", null, "Added \"Set all to value\" button on learning page"), VirtualDOM.createVirtualElement("li", null, "Bosses will now drop heirlooms (Up to legendary tier)"), VirtualDOM.createVirtualElement("li", null, "Added new heirlooms modifiers"), VirtualDOM.createVirtualElement("li", null, "Added new bosses")), VirtualDOM.createVirtualElement("h4", null, "Version 0.1.7 (03.12.2022)"), VirtualDOM.createVirtualElement("ul", null, VirtualDOM.createVirtualElement("li", null, "Added \"Optimize\" button next to banners, that should help get max out of your banners"), VirtualDOM.createVirtualElement("li", null, "Added total building queue time"), VirtualDOM.createVirtualElement("li", null, "Added 3 more later game researches and 4 buildings")), VirtualDOM.createVirtualElement("h4", null, "Version 0.1.6a (29.11.2022)"), VirtualDOM.createVirtualElement("ul", null, VirtualDOM.createVirtualElement("li", null, "Fixed bug when you can go negative on flasks"), VirtualDOM.createVirtualElement("li", null, "Added quality aura filter")), VirtualDOM.createVirtualElement("h4", null, "Version 0.1.6 (29.11.2022)"), VirtualDOM.createVirtualElement("ul", null, VirtualDOM.createVirtualElement("li", null, "Banners now have diminishing effect after 10K amount"), VirtualDOM.createVirtualElement("li", null, "Added hint when it worth to convert banner tier (exchange arrows appear on top right of banner item block)"), VirtualDOM.createVirtualElement("li", null, "Added new megastructures"), VirtualDOM.createVirtualElement("li", null, "Added new mid-game buildings and researches"), VirtualDOM.createVirtualElement("li", null, "Fixed bug when endurance and aggression flasks effect was calculated incorrectly"), VirtualDOM.createVirtualElement("li", null, "Decreased costs of crafting"), VirtualDOM.createVirtualElement("li", null, "UI fixes for buildings queue")), VirtualDOM.createVirtualElement("h4", null, "Version 0.1.5 (27.11.2022)"), VirtualDOM.createVirtualElement("ul", null, VirtualDOM.createVirtualElement("li", null, "Added new flask types"), VirtualDOM.createVirtualElement("li", null, "Added new researches"), VirtualDOM.createVirtualElement("li", null, "Added new bosses"), VirtualDOM.createVirtualElement("li", null, "Updated sidebar UI - now resources displayed are configurable."), VirtualDOM.createVirtualElement("li", null, "Added new resource, providing possibility to persist buildings/captured territory through resets")), VirtualDOM.createVirtualElement("h4", null, "Version 0.1.4 (26.11.2022)"), VirtualDOM.createVirtualElement("ul", null, VirtualDOM.createVirtualElement("li", null, "Improved fighting mechanics: added new attributes, different enemy types"), VirtualDOM.createVirtualElement("li", null, "Added new mid-game content - auras, providing various bonuses"), VirtualDOM.createVirtualElement("li", null, "Added boss arena mechanics (unlocked after you research building)"), VirtualDOM.createVirtualElement("li", null, "Fixed couple UI bugs and grammar."), VirtualDOM.createVirtualElement("li", null, "Rebalanced heirloom drop rarity")), VirtualDOM.createVirtualElement("h4", null, "Version 0.1.3a (14.11.2022)"), VirtualDOM.createVirtualElement("ul", null, VirtualDOM.createVirtualElement("li", null, "Fixed couple UI bugs")), VirtualDOM.createVirtualElement("h4", null, "Version 0.1.3 (12.11.2022)"), VirtualDOM.createVirtualElement("ul", null, VirtualDOM.createVirtualElement("li", null, "Fixed old bug when energetic temper did not gave 10 free trainings"), VirtualDOM.createVirtualElement("li", null, "Moved Story and Settings to separate menu"), VirtualDOM.createVirtualElement("li", null, "Added hotkeys settings."), VirtualDOM.createVirtualElement("li", null, "Changed banners formula. Bonus now is calculated as (1+a*(1+b*(1+...)))"), VirtualDOM.createVirtualElement("li", null, "Change UI controls in learning page (similar to creatures tab)"), VirtualDOM.createVirtualElement("li", null, "Added \"Condensed time\", granted when you offline and allowing you to accelerate things")), VirtualDOM.createVirtualElement("h4", null, "Version 0.1.2a (06.11.2022)"), VirtualDOM.createVirtualElement("ul", null, VirtualDOM.createVirtualElement("li", null, "Fixed issue with buildings in queue can cause negative amount of gold"), VirtualDOM.createVirtualElement("li", null, "Fixed bug when queue not saved"), VirtualDOM.createVirtualElement("li", null, "Fixed bug when some buildings effect was calculated incorrectly"), VirtualDOM.createVirtualElement("li", null, "Fixed bug when territory awards in some cases was incorrect")), VirtualDOM.createVirtualElement("h4", null, "Version 0.1.2 (05.11.2022)"), VirtualDOM.createVirtualElement("ul", null, VirtualDOM.createVirtualElement("li", null, "Added mega structures, that persist through reset."), VirtualDOM.createVirtualElement("li", null, "Added heirlooms (earned in fights, providing various bonuses, persist through reset)"), VirtualDOM.createVirtualElement("li", null, "Added building queue"), VirtualDOM.createVirtualElement("li", null, "Add couple new buildings, researches and resources"), VirtualDOM.createVirtualElement("li", null, "Add cooldown to banners prestige (45 seconds per run limitation)"), VirtualDOM.createVirtualElement("li", null, "Fixed rounding bugs, slider's  on creatures page, descriptions")), VirtualDOM.createVirtualElement("h4", null, "Version 0.1.1 (30.10.2022)"), VirtualDOM.createVirtualElement("ul", null, VirtualDOM.createVirtualElement("li", null, "Updated UI for creature jobs selectors"), VirtualDOM.createVirtualElement("li", null, "Added ability to revert banners convesion"), VirtualDOM.createVirtualElement("li", null, "Added 2 new researches"), VirtualDOM.createVirtualElement("li", null, "Added new building"), VirtualDOM.createVirtualElement("li", null, "Fixed bugs when some buildings had no effect"), VirtualDOM.createVirtualElement("li", null, "Added notification settings")), VirtualDOM.createVirtualElement("h4", null, "Version 0.1.0 (29.10.2022)"), VirtualDOM.createVirtualElement("ul", null, VirtualDOM.createVirtualElement("li", null, "Added possibility to select your temper on prestige (providing certain bonuses to next run)"), VirtualDOM.createVirtualElement("li", null, "Banners tab now allows to convert 10% of your previous tier"), VirtualDOM.createVirtualElement("li", null, "Added new early-game shop items providing more automation and bigger bonuses to energe regeneration"), VirtualDOM.createVirtualElement("li", null, "Added more than 10 new researches, including ones that will make starting runs easier"), VirtualDOM.createVirtualElement("li", null, "Added new buildings"), VirtualDOM.createVirtualElement("li", null, "Increased fighting rewards"), VirtualDOM.createVirtualElement("li", null, "Improved UI (sidebar, learning controls, and other small fixes/improvements)"), VirtualDOM.createVirtualElement("li", null, "Added \"Purchase all available\" button in shop")), VirtualDOM.createVirtualElement("h4", null, "Version 0.0.4 (26.10.2022)"), VirtualDOM.createVirtualElement("ul", null, VirtualDOM.createVirtualElement("li", null, "Added building mechanics (basics)"), VirtualDOM.createVirtualElement("li", null, "Added possibility to show purchased shop items"), VirtualDOM.createVirtualElement("li", null, "Fixed bug when converting banners caused rewrite instead of add amount"), VirtualDOM.createVirtualElement("li", null, "Fixed bug when green banner didn't affected gold from work on stable"), VirtualDOM.createVirtualElement("li", null, "Fixed export game issues (copy to buffer)")), VirtualDOM.createVirtualElement("h4", null, "Version 0.0.3 (22.10.2022)"), VirtualDOM.createVirtualElement("ul", null, VirtualDOM.createVirtualElement("li", null, "Balance update: increased max mana gain by courses, decreased tireless research effect"), VirtualDOM.createVirtualElement("li", null, "Added story page with current and passed milestones"), VirtualDOM.createVirtualElement("li", null, "Added resource balance to sidebar"), VirtualDOM.createVirtualElement("li", null, "Effects of all actions and spells are now shown"), VirtualDOM.createVirtualElement("li", null, "Improved shop items descriptions"), VirtualDOM.createVirtualElement("li", null, "Fixed grammar mistakes"), VirtualDOM.createVirtualElement("li", null, "Fixed bug when some content was not visible under specific screen resolutions")), VirtualDOM.createVirtualElement("h4", null, "Version 0.0.2 (21.10.2022)"), VirtualDOM.createVirtualElement("ul", null, VirtualDOM.createVirtualElement("li", null, "Added new researches"), VirtualDOM.createVirtualElement("li", null, "Added battle mechanics"), VirtualDOM.createVirtualElement("li", null, "Added researcher banner"), VirtualDOM.createVirtualElement("li", null, "UI fixes"))), VirtualDOM.createVirtualElement("div", {
      className: 'version-items'
    }, VirtualDOM.createVirtualElement("h4", null, "Version 0.0.1 (12.10.2022)"), VirtualDOM.createVirtualElement("ul", null, VirtualDOM.createVirtualElement("li", null, "Initial build"), VirtualDOM.createVirtualElement("li", null, "Include plenty shop items"), VirtualDOM.createVirtualElement("li", null, "Researches"), VirtualDOM.createVirtualElement("li", null, "Prestige layer (banners)")))), VirtualDOM.createVirtualElement(Modal, {
      modalId: 'about',
      title: 'About'
    }, VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement("p", {
      className: 'padded'
    }, "My first incremental game, inspired by", ' ', VirtualDOM.createVirtualElement("a", {
      href: 'https://mathiashjelm.gitlab.io/arcanum/',
      target: '_blank',
      className: 'link'
    }, "Theory of Magic"), ",", ' ', VirtualDOM.createVirtualElement("a", {
      href: 'https://kittensgame.com/web/',
      target: '_blank',
      className: 'link'
    }, "Kittens Game"), ' ', "and plenty other incrementals (I am too lazy to mention all of them here :) )"), VirtualDOM.createVirtualElement("p", {
      className: 'padded'
    }, "Thanks to ", VirtualDOM.createVirtualElement("a", {
      href: 'https://icons8.com/',
      target: '_blank',
      className: 'link'
    }, "Icons8.com"), " for letting use their icons"), VirtualDOM.createVirtualElement("p", {
      className: 'padded'
    }, "Especial thanks to Ukrainian Military forces for defending my country and letting me spend my time developing weird games."))));

    ColibriWorker.setup('./worker.js');
    ColibriClient.sendToWorker('initialize', {
      ping: true,
      save: localStorage.getItem('localSave')
    });
    ColibriClient.on('initialized', e => {
      console.log('[client] connected to worker: ', e);
    });
    ColibriClient.on('update_resources', rs => {
      State.setState('game.resources', rs);
    });
    ColibriClient.on('set_general', pl => {
      State.setState('game.general', pl);
    });
    ColibriClient.on('save_to_local', data => {
      localStorage.setItem('localSave', data);
    });

    const switchSetting = (path, value) => {
      console.log('changeSetting: ', path, value);
      ColibriClient.sendToWorker('change_setting', {
        path,
        value
      });
    };

    document.onkeydown = e => {
      if (['Shift', 'Alt'].includes(e.key)) return;
      const event = {
        key: e.key,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey
      };
      const keysSettings = State.queryState('game.general.settings.hotKeys', {});
      const keySelect = State.queryState('game.ui.selectKey', false);

      if (keySelect) {
        switchSetting(keySelect, event);
        State.setState('game.ui.selectKey', false);
        return;
      }

      const action = Object.entries(keysSettings).find(([action, evt]) => evt && evt.key === event.key && evt.ctrlKey === event.ctrlKey && evt.shiftKey === event.shiftKey && evt.altKey === event.altKey);
      console.log('actionFound: ', action);
      if (!action) return;
      const tp = action[0];

      switch (tp) {
        case 'tab_actions':
          switchTab('jobs');
          break;

        case 'tab_shop':
          switchTab('shop');
          break;

        case 'tab_creatures':
          switchTab('creatures');
          break;

        case 'tab_learning':
          switchTab('learning');
          break;

        case 'tab_banners':
          switchTab('banners');
          break;

        case 'tab_research':
          switchTab('research');
          break;

        case 'tab_battle':
          switchTab('battle');
          break;

        case 'tab_heirlooms':
          switchTab('heirloom');
          break;

        case 'tab_story':
          switchTab('story');
          break;

        case 'tab_building':
          switchTab('building');
          break;

        case 'tab_settings':
          switchTab('settings');
          break;

        case 'summon':
          const amount = State.queryState('game.creatures.summon.amount', 1);
          summon(amount);
          break;

        case 'summon_max':
          summon(1.e+306);
          break;
      }
    };

    setInterval(() => {
      const tab = State.queryState('ui.navigation.page', 'jobs');

      switch (tab) {
        case 'jobs':
          ColibriClient.sendToWorker('get_jobs_tab');
          break;

        case 'shop':
          ColibriClient.sendToWorker('get_shop_tab');
          break;

        case 'creatures':
          ColibriClient.sendToWorker('get_creatures_tab');
          break;

        case 'learning':
          ColibriClient.sendToWorker('get_learning_tab');
          break;

        case 'banners':
          ColibriClient.sendToWorker('get_banners_tab');
          break;

        case 'research':
          ColibriClient.sendToWorker('get_research_tab');
          break;

        case 'battle':
          ColibriClient.sendToWorker('get_battle_tab');
          break;

        case 'heirlooms':
          ColibriClient.sendToWorker('get_heirlooms_tab');
          break;

        case 'story':
          ColibriClient.sendToWorker('get_story_tab');
          break;

        case 'building':
          ColibriClient.sendToWorker('get_buildings_tab');
          break;

        case 'auras':
          ColibriClient.sendToWorker('get_auras_tab');
          break;

        case 'settings':
          ColibriClient.sendToWorker('get_settings_tab');
          break;
      }
    }, 200);
    ColibriClient.listen();

    const App = () => {
      return VirtualDOM.createVirtualElement(Game, null);
    };

    initColibriApp('app', App, {
      rerenderInterval: 100,
      debugVirtualDom: false
    });

}));
