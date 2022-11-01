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
    }, "Locked"), unlocks.building ? VirtualDOM.createVirtualElement("p", {
      className: `menu-item ${selectedTab === 'building' ? 'selected' : ''}`,
      monitorId: 'building',
      onClick: useCiCallback(() => {
        console.log('clicked building');
        switchTab('building');
      })
    }, "Building") : VirtualDOM.createVirtualElement("p", {
      className: 'locked'
    }, "Locked"), VirtualDOM.createVirtualElement("p", {
      className: `menu-item ${selectedTab === 'story' ? 'selected' : ''}`,
      monitorId: 'story',
      onClick: useCiCallback(() => {
        switchTab('story');
      })
    }, "Story"), VirtualDOM.createVirtualElement("p", {
      className: `menu-item ${selectedTab === 'settings' ? 'selected' : ''}`,
      monitorId: 'settings',
      onClick: useCiCallback(() => {
        switchTab('settings');
      })
    }, "Settings")));
    const Header = () => {
      const tabId = State.queryState('ui.navigation.page', 'jobs');
      const resourcesUnlocked = State.queryState('game.resources', []).filter(one => one.isUnlocked).map(one => one.id);
      const general = State.queryState('game.general', {});
      const unlocks = {
        creatures: resourcesUnlocked.includes('souls'),
        banners: general.bannersUnlocked,
        research: general.researchUnlocked,
        battle: general.battleUnlocked,
        building: general.buildingUnlocked
      };
      return VirtualDOM.createVirtualElement("div", {
        className: 'header'
      }, VirtualDOM.createVirtualElement("h1", null, "Idlemancery"), VirtualDOM.createVirtualElement(Navigation, {
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

    var css_248z$e = ".footer {\r\n    position: fixed;\r\n    height: 40px;\r\n    background: #030304;\r\n    border-top: 1px solid #333;\r\n    padding: 5px;\r\n    bottom: 0;\r\n    width: 100%;\r\n}\r\n.menu-wrap {\r\n    width: 100%;\r\n    background: #000;\r\n    padding-left: 20px;\r\n}\r\n\r\n.menu {\r\n    display: flex;\r\n}\r\n\r\n.menu-item {\r\n    padding: 10px 12px;\r\n    cursor: pointer;\r\n    margin: 0;\r\n}\r\n\r\n.menu-item.selected,\r\n.menu-item:hover {\r\n    background: #111119;\r\n    font-weight: bold;\r\n}\r\n\r\n.header {\r\n    position: fixed;\r\n    top: 0px;\r\n    background: #121520;\r\n    width: 100%;\r\n    z-index: 2;\r\n}\r\n\r\n.locked {\r\n    color: #aaa;\r\n    padding: 10px 12px;\r\n    margin: 0;\r\n}";
    styleInject(css_248z$e);

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
      if (val == null) return null;
      if (!val) return 0;
      const sign = Math.sign(val);
      const abs = Math.abs(val);
      const orders = Math.log10(abs);

      if (orders < 0) {
        return `${sign < 0 ? '-' : ''}${abs.toFixed(2)}`;
      }

      const suffixId = Math.floor(orders / 3);
      const mpart = (abs / Math.pow(1000, suffixId)).toFixed(2);
      let suffix = '';

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
      }

      return `${sign < 0 ? '-' : ''}${mpart}${suffix}`;
    };
    function secondsToHms(d) {
      if (!d) return '';
      d = Number(d);
      var h = Math.floor(d / 3600);
      var m = Math.floor(d % 3600 / 60);
      var s = Math.floor(d % 3600 % 60);
      var hDisplay = h > 9 ? `${h}:` : `0${h}:`;
      var mDisplay = m > 9 ? `${m}:` : `0${m}:`;
      var sDisplay = s > 9 ? `${s}` : `0${s}`;
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
    }, "v0.1.1"), VirtualDOM.createVirtualElement("p", {
      className: 'popup-link',
      onClick: showAbout
    }, "About"), VirtualDOM.createVirtualElement("p", null, VirtualDOM.createVirtualElement("a", {
      className: 'popup-link',
      href: 'https://discord.gg/TRRvKf4ZTG',
      target: '_blank'
    }, "Join Discord"))), VirtualDOM.createVirtualElement("p", null, "Time spent: ", secondsToHms(general?.timeSpent)));
    const Footer = () => {
      const general = State.queryState('game.general', {});
      return VirtualDOM.createVirtualElement(FooterUI, {
        general: general
      });
    };

    var css_248z$d = ".sidebar {\r\n    margin-right: 15px;\r\n    background: #000000;\r\n    padding: 15px;\r\n    width: 290px;\r\n    flex-shrink: 0;\r\n    min-height: calc(100vh - 180px);\r\n    position: relative;\r\n}\r\n\r\n.sidebar.collapsed {\r\n    width: 110px;\r\n}\r\n\r\n.sidebar .inner-sidebar {\r\n    position: fixed;\r\n    width: 260px;\r\n}\r\n\r\n.sidebar.collapsed .inner-sidebar {\r\n    position: fixed;\r\n    width: 80px;\r\n}\r\n\r\n.sidebar .toggle-collapsed {\r\n    color: #aaa;\r\n    background: #411149;\r\n    border-radius: 25%;\r\n    width: 32px;\r\n    height: 32px;\r\n    position: absolute;\r\n    top: -8px;\r\n    right: -32px;\r\n    font-size: 42px;\r\n    text-align: center;\r\n    line-height: 24px;\r\n    cursor: pointer;\r\n}\r\n\r\n.sidebar .relative-wrap {\r\n    position: relative;\r\n}\r\n\r\n.sidebar .toggle-collapsed:hover {\r\n    background: #613169;\r\n}\r\n\r\n.sidebar .resourceName {\r\n    width: 80px;\r\n    display: inline-block;\r\n}\r\n\r\n.resource-line {\r\n    display: flex;\r\n}\r\n\r\n.resource-line .income {\r\n    font-size: 12px;\r\n    margin-left: 5px;\r\n}\r\n\r\n.resource-line .income.positive {\r\n    color: #53a862;\r\n}\r\n\r\n.resource-line .income.negative {\r\n    color: #ad2121;\r\n}";
    styleInject(css_248z$d);

    const Tooltip = ({
      id,
      tooltipText
    }, children) => {
      if (!children || children.length !== 1) {
        throw new Error('Tooltip should wrap exactly one item');
      }

      children[0].listeners.onmouseenter = {
        currCb: (id, tooltipText, e) => {
          const docId = `tooltip-${id}`;
          let item = document.getElementById(docId);

          if (!item) {
            item = document.createElement('div');
            item.setAttribute("id", docId);
            item.setAttribute("class", 'hint');
            document.body.appendChild(item);
          }

          item.innerHTML = tooltipText;
          console.log('item', item);
        },
        deps: [id, tooltipText],
        isCachable: true
      };
      children[0].listeners.onmouseleave = {
        currCb: (id, e) => {
          const docId = `tooltip-${id}`;
          let item = document.getElementById(docId);

          if (item) {
            document.body.removeChild(item);
            item.remove();
          }
        },
        deps: [id],
        isCachable: true
      };
      return children;
    };

    const HTTP_PATH = '';

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

    const ResourceItem = ({
      id,
      name,
      amount,
      max,
      income,
      incomeText,
      collapsed
    }) => VirtualDOM.createVirtualElement("p", {
      resourceId: id,
      className: 'resource-line'
    }, VirtualDOM.createVirtualElement(ResourceIcon, {
      id: id
    }), !collapsed ? VirtualDOM.createVirtualElement("span", {
      className: 'resourceName'
    }, name) : null, VirtualDOM.createVirtualElement("span", {
      className: 'resourceAmount'
    }, fmtVal(amount)), max && !collapsed ? VirtualDOM.createVirtualElement("span", {
      className: 'resourceMax'
    }, " / ", fmtVal(max)) : null, income && !collapsed ? VirtualDOM.createVirtualElement("span", {
      className: `income ${income > 0 ? 'positive' : 'negative'}`
    }, income > 0 ? '+' : '', incomeText) : null);
    const SidebarUI = ({
      resources,
      expanded
    }) => VirtualDOM.createVirtualElement("div", {
      className: `sidebar ${expanded ? 'expanded' : 'collapsed'}`
    }, VirtualDOM.createVirtualElement("div", {
      className: 'inner-sidebar'
    }, VirtualDOM.createVirtualElement("div", {
      className: 'relative-wrap'
    }, VirtualDOM.createVirtualElement("div", {
      className: 'toggle-collapsed',
      onClick: useCiCallback(expanded => toggleExpanded(!expanded), [expanded])
    }, expanded ? '<' : '>'), resources ? resources.filter(one => one.isUnlocked).map(rs => VirtualDOM.createVirtualElement(Tooltip, {
      id: `res_${rs.id}`,
      tooltipText: `Income: ${rs.income || 0} / s`
    }, VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement(ResourceItem, _extends({}, rs, {
      collapsed: !expanded
    }))))) : VirtualDOM.createVirtualElement("span", null, "Loading..."))));
    const Sidebar = () => {
      const resources = State.queryState('game.resources');
      const expanded = State.queryState('game.ui.sidebarExpanded', true);
      return VirtualDOM.createVirtualElement(SidebarUI, {
        resources: resources,
        expanded: expanded
      });
    };

    var css_248z$c = ".in-game {\n    display: flex;\n    padding: 20px;\n    margin-top: 100px;\n}\n\n.run-content {\n    flex: 1;\n    margin-bottom: 50px;\n}";
    styleInject(css_248z$c);

    var css_248z$b = ".actions {\n    display: flex;\n    flex-wrap: wrap;\n    justify-content: flex-start;\n}\n\n.action-wrapper {\n    width: 260px;\n    text-align: center;\n    margin: 5px;\n    padding: 10px;\n    background: #030304;\n}\n\n.action-wrapper button {\n    margin: 10px auto auto;\n    width: 180px;\n}\n\n.action-wrapper .produces,\n.action-wrapper .costs {\n    display: flex;\n    padding-left: 50px;\n}\n\n.action-wrapper .produces .resourceList,\n.action-wrapper .costs .resourceList {\n    padding-left: 10px;\n}\n\n.custom-gain {\n    margin-left: 5px;\n}";
    styleInject(css_248z$b);

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
    }, VirtualDOM.createVirtualElement("p", null, one.description), VirtualDOM.createVirtualElement("div", {
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

    var css_248z$a = "\r\n.shop-settings {\r\n    margin: 0 5px 5px;\r\n    padding: 10px;\r\n    background: #030304;\r\n    display: flex;\r\n    align-items: center;\r\n    justify-content: space-between;\r\n}\r\n\r\n.shop-items {\r\n    display: flex;\r\n    flex-wrap: wrap;\r\n    justify-content: flex-start;\r\n}\r\n\r\n.shop-item-wrapper {\r\n    width: 260px;\r\n    text-align: center;\r\n    margin: 5px;\r\n    padding: 10px;\r\n    background: #030304;\r\n}\r\n\r\n.shop-item-wrapper button {\r\n    margin: auto;\r\n    width: 140px;\r\n}\r\n\r\n.item-resources {\r\n    padding-left: 50px;\r\n}";
    styleInject(css_248z$a);

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

    var css_248z$9 = ".summon-creature {\r\n    display: flex;\r\n    justify-content: flex-start;\r\n    background: #030304;\r\n    padding: 20px;\r\n    width: 100%;\r\n}\r\n\r\n.summon-creature .change-amount {\r\n    margin-right: 10px;\r\n    margin-left: auto;\r\n}\r\n\r\n.summon-creature .cost-wrap {\r\n    margin-left: 20px;\r\n}\r\n\r\n.work-places {\r\n    background: #030304;\r\n    padding: 10px;\r\n}\r\n\r\n.work-places .job-row {\r\n    display: flex;\r\n    justify-content: space-between;\r\n    align-items: center;\r\n}\r\n.work-places .job-row > div {\r\n    width: 250px;\r\n}\r\n\r\n.work-places .job-row .actions {\r\n    align-items: center;\r\n    justify-content: space-around;\r\n}\r\n\r\n.creature-notes {\r\n    margin-left: 20px;\r\n    flex: 1;\r\n}\r\n\r\n.creature-name {\r\n    font-size: 14px;\r\n    font-weight: bold;\r\n}\r\n\r\n.summon-wrap {\r\n    min-width: 120px;\r\n}\r\n\r\n.categories {\r\n    display: flex;\r\n}\r\n\r\n.categories .popup-link {\r\n    padding: 3px 5px;\r\n}\r\n\r\n.categories .selected {\r\n    color: #ffffff;\r\n}\r\n\r\n.creature-jobs-slider {\r\n    width: calc(100% - 40px);\r\n    margin: 5px 20px;\r\n}";
    styleInject(css_248z$9);

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

    const selectCategory = cat => {
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
      }, "Free workers:  ", freeWorkers), VirtualDOM.createVirtualElement("div", {
        className: 'categories'
      }, categories.map(one => {
        return VirtualDOM.createVirtualElement("p", {
          className: `popup-link ${one === selectedCat ? 'selected' : ''}`,
          onClick: useCiCallback(cat => selectCategory(cat), [one])
        }, one);
      }))), VirtualDOM.createVirtualElement("div", {
        className: 'job-rows'
      }, jobs ? jobs.filter(one => one.isUnlocked).map(one => VirtualDOM.createVirtualElement("div", {
        className: 'job-row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'name'
      }, VirtualDOM.createVirtualElement("p", {
        className: 'creature-name'
      }, one.name), VirtualDOM.createVirtualElement("p", null, one.description)), VirtualDOM.createVirtualElement("div", {
        className: 'income'
      }, VirtualDOM.createVirtualElement("p", null, "Produce: "), VirtualDOM.createVirtualElement(ResourcesList, {
        data: one.gain
      })), VirtualDOM.createVirtualElement("div", {
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
        min: 0,
        value: one.current,
        max: freeWorkers + one.current,
        onChange: useCiCallback((id, amount, e) => changeWorkes(id, e.target.value - amount), [one.id, one.current])
      }) : null))) : VirtualDOM.createVirtualElement("p", null, "No jobs available")));
    };
    const SummonCreature = ({
      info
    }) => {
      return VirtualDOM.createVirtualElement("div", {
        className: 'summon-creature'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'summon-wrap'
      }, VirtualDOM.createVirtualElement("p", null, "Total creatures: ", info?.numCreatures), VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement("button", {
        className: 'main-action',
        onClick: useCiCallback(amount => summon(amount), [info.amount]),
        disabled: !info?.cost?.isAvailable
      }, "Summon (x", info.amount, ")"))), VirtualDOM.createVirtualElement("div", {
        className: 'cost-wrap'
      }, VirtualDOM.createVirtualElement("p", null, "Cost:"), VirtualDOM.createVirtualElement(ResourcesList, {
        data: info?.cost
      })), VirtualDOM.createVirtualElement("div", {
        className: 'creature-notes'
      }, VirtualDOM.createVirtualElement("p", null, "Requires ", info.energyRequired, " max energy at least"), VirtualDOM.createVirtualElement("p", null, "Every creature consumes ", fmtVal(info.consumptionPerCreature), " energy per second. When you run out of energy your creatures will disappear. Make sure you have enough energy production before spending precious souls.")), VirtualDOM.createVirtualElement("div", {
        className: 'change-amount'
      }, VirtualDOM.createVirtualElement("p", null, "Amount per click:"), VirtualDOM.createVirtualElement("input", {
        type: 'number',
        onChange: useCiCallback(e => change_amount(e.target.value)),
        value: info.amount
      })));
    };
    const Creatures = () => {
      const info = State.queryState('game.creatures.summon');
      const jobs = State.queryState('game.creatures.jobs', []);
      const selectedCat = State.queryState('game.creatures.category', 'All');
      const byCats = {
        All: []
      };
      jobs?.jobs.forEach(one => {
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
        amount: info.amount,
        selectedCat: selectedCat,
        controlsSettings: controlsSettings
      }));
    };

    var css_248z$8 = ".skills-container .skills-settings {\r\n    background: #030304;\r\n    padding: 20px;\r\n    margin-bottom: 10px;\r\n}\r\n\r\n.skills-rows {\r\n    background: #030304;\r\n    padding: 20px;\r\n}\r\n\r\n.skills-container .skill-row {\r\n    display: flex;\r\n    justify-content: space-between;\r\n    align-items: center;\r\n}\r\n.skills-container .skill-row > div {\r\n    width: 200px;\r\n}\r\n\r\n.skills-container .skill-row .xp-bar {\r\n    width: 300px;\r\n}\r\n\r\n.skills-container .skill-row .xp-bar .outer-span {\r\n    width: 300px;\r\n}\r\n.skills-container .skill-row .xp-bar .tiny {\r\n    font-size: 12px;\r\n    text-align: right;\r\n    margin: 0;\r\n}\r\n\r\n\r\n.skills-container .skill-row .actions {\r\n    display: block;\r\n}\r\n\r\n.skills-container .skill-row .actions .effort {\r\n    margin: 0 5px;\r\n}";
    styleInject(css_248z$8);

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

    const changeEfforts = (id, amount) => {
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

    ColibriClient.on('set_skills_state', payload => {
      State.setState('game.learning.skills', payload);
    });
    const Skills = ({
      skills,
      amount
    }) => {
      return VirtualDOM.createVirtualElement("div", {
        className: 'skills-container'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'skills-settings flex'
      }, VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement("p", null, "By setting effort you are setting amount of energy you will spend per second to learn skill. Maximum effort per skill is 50% of your max energy ")), VirtualDOM.createVirtualElement("div", {
        className: 'change-amount'
      }, VirtualDOM.createVirtualElement("p", null, "Amount per click:"), VirtualDOM.createVirtualElement("input", {
        type: 'number',
        onChange: useCiCallback(e => setAllValue(e.target.value)),
        value: amount
      })), VirtualDOM.createVirtualElement("div", {
        className: 'change-to-zero'
      }, VirtualDOM.createVirtualElement("button", {
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
      }, VirtualDOM.createVirtualElement("button", {
        className: 'main-action',
        onClick: useCiCallback((id, amount, c) => changeEfforts(id, +c - amount), [one.id, amount, one.efforts])
      }, "-", amount), VirtualDOM.createVirtualElement("span", {
        className: 'effort'
      }, one.efforts), VirtualDOM.createVirtualElement("button", {
        className: 'main-action',
        onClick: useCiCallback((id, amount, c) => changeEfforts(id, +c + amount), [one.id, amount, one.efforts])
      }, "+", amount))))) : VirtualDOM.createVirtualElement("p", null, "No skills available")));
    };
    const Learning = () => {
      const skills = State.queryState('game.learning.skills', []);
      const defaultValue = State.queryState('game.learning.value', 0.5);
      return VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement(Skills, {
        skills: skills?.filter(one => one.isUnlocked),
        amount: defaultValue
      }));
    };

    var css_248z$7 = "\r\n.banners-container {\r\n    padding: 10px;\r\n}\r\n\r\n.banners-container .info-container {\r\n    background: #030304;\r\n    padding: 10px 20px;\r\n}\r\n\r\n.flex-banner {\r\n    display: flex;\r\n    justify-content: space-between;\r\n}\r\n\r\n.banners-container .banners-row {\r\n    display: flex;\r\n    justify-content: space-between;\r\n}\r\n\r\n.banners-container .banner-row {\r\n    margin-top: 10px;\r\n    background: #030304;\r\n    padding: 10px 20px;\r\n}\r\n\r\n.banners-container .banner-box .action-buttons button{\r\n    width: 150px;\r\n    margin-bottom: 5px;\r\n}\r\n\r\n.banners-container .tiers-row {\r\n    display: flex;\r\n    justify-content: flex-start;\r\n    align-items: center;\r\n}\r\n.banners-container .tiers-row > .banner-box {\r\n    width: 160px;\r\n    height: 150px;\r\n}\r\n\r\n.inner-banner {\r\n    padding-left: 10px;\r\n}\r\n\r\n.inner-banner .amount {\r\n    font-weight: bold;\r\n    font-size: 15px;\r\n}\r\n\r\n.skills-container .skill-row .actions {\r\n\r\n}\r\n\r\n.banners-note {\r\n    /* font-style: italic; */\r\n}\r\n\r\n.revert {\r\n    margin-left: 20px;\r\n}\r\n\r\n.revert .undo-icon {\r\n    width: 32px;\r\n    height: 32px;\r\n    margin: auto;\r\n    cursor: pointer;\r\n    opacity: 0.7;\r\n    display: block;\r\n    object-fit: contain;\r\n}\r\n\r\n.revert .undo-icon:hover {\r\n    opacity: 1;\r\n}";
    styleInject(css_248z$7);

    const Icon = ({
      scope,
      id,
      className,
      onClick
    }) => VirtualDOM.createVirtualElement("span", {
      className: `icon-wrap ${className}`,
      onClick: onclick
    }, VirtualDOM.createVirtualElement("img", {
      src: `${HTTP_PATH}static/icons/${scope}/${id}.png`
    }));

    const prestige = id => {
      console.log('prestieging', id);
      ColibriClient.sendToWorker('do_prestige', id);
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
    }, VirtualDOM.createVirtualElement("h5", null, banner.name), VirtualDOM.createVirtualElement("p", null, banner.description)), banner.tiers && banner.isChanged ? VirtualDOM.createVirtualElement("div", {
      className: 'revert'
    }, VirtualDOM.createVirtualElement("div", {
      onClick: useCiCallback(id => revertBanner(id), [banner.id])
    }, VirtualDOM.createVirtualElement(Icon, {
      scope: 'ui',
      id: 'undo',
      className: 'undo-icon'
    })), VirtualDOM.createVirtualElement("p", null, "Revert changes")) : null), VirtualDOM.createVirtualElement("div", {
      className: 'tiers-row'
    }, banner.tiers ? banner.tiers.map((tier, index) => VirtualDOM.createVirtualElement("div", {
      className: 'banner-box'
    }, VirtualDOM.createVirtualElement("div", {
      className: 'inner-banner',
      style: `border-left: 10px solid ${banner.color};`
    }, VirtualDOM.createVirtualElement("p", null, "Tier ", index), VirtualDOM.createVirtualElement("span", {
      className: 'amount'
    }, fmtVal(tier.amount)), VirtualDOM.createVirtualElement("p", null, (tier.effectCumulative * 100).toFixed(2), "%")), VirtualDOM.createVirtualElement("div", null, tier.canPrestige ? VirtualDOM.createVirtualElement("button", {
      className: 'main-action',
      onClick: useCiCallback(id => prestige(id), [banner.id])
    }, "Prestige (+", fmtVal(tier.maxConversion), ")") : null, tier.isConvertable ? VirtualDOM.createVirtualElement("div", {
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

    var css_248z$6 = ".researches {\r\n    display: flex;\r\n    flex-wrap: wrap;\r\n    justify-content: flex-start;\r\n}\r\n\r\n.research-wrapper {\r\n    width: 260px;\r\n    text-align: center;\r\n    margin: 5px;\r\n    padding: 10px;\r\n    background: #030304;\r\n}\r\n\r\n.research-wrapper button {\r\n    margin: 10px auto auto;\r\n    width: 140px;\r\n}\r\n\r\n\r\n.research-wrapper .costs {\r\n    display: flex;\r\n    padding-left: 50px;\r\n}\r\n\r\n.research-wrapper .costs .resourceList {\r\n    padding-left: 10px;\r\n}\r\n\r\n.research-settings {\r\n    margin: 0 5px 5px;\r\n    padding: 10px;\r\n    background: #030304;\r\n    display: flex;\r\n    align-items: center;\r\n    justify-content: space-between;\r\n}\r\n\r\n.maxed-out {\r\n    color: #aaa;\r\n}";
    styleInject(css_248z$6);

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

    var css_248z$5 = "\r\n.mapInfo, .fighting {\r\n    background: #030304;\r\n    padding: 20px;\r\n}\r\n\r\n.mapInfo .info h5 {\r\n    width: 200px;\r\n    margin-right: 20px;\r\n}\r\n\r\n.map-settings {\r\n    display: flex;\r\n    justify-content: space-between;\r\n}\r\n\r\n.fighting {\r\n    margin-top: 10px;\r\n}\r\n\r\n.fighting .sides {\r\n    display: flex;\r\n    justify-content: space-between;\r\n    align-items: center;\r\n}\r\n.sides .side {\r\n    padding: 10px;\r\n    margin: 10px;\r\n    width: 280px;\r\n}\r\n\r\n.sides .side p {\r\n    margin-block-start: 0.25em;\r\n    margin-block-end: 0.25em;\r\n}\r\n\r\n.flex-block {\r\n    display: flex;\r\n    justify-content: space-between;\r\n}\r\n\r\n.item-with-icon {\r\n    display: flex;\r\n}\r\n\r\n.item-with-icon img {\r\n    object-fit: contain;\r\n    width: 18px;\r\n    height: 18px;\r\n    margin-right: 5px;\r\n}";
    styleInject(css_248z$5);

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

    const MapInfo = ({
      map
    }) => VirtualDOM.createVirtualElement("div", {
      className: 'mapInfo'
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
    }, VirtualDOM.createVirtualElement("p", null, "Toggle auto-next map"), VirtualDOM.createVirtualElement("button", {
      className: 'main-action',
      onClick: toggleForward,
      disabled: !map.isFightAvailable
    }, map.isForward ? 'Turn off' : 'Turn on'))));
    const Fight = ({
      fight,
      map
    }) => {
      if (!fight.parties || !map.isTurnedOn) return VirtualDOM.createVirtualElement("p", null, "None");
      return VirtualDOM.createVirtualElement("div", {
        className: 'fighting'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'sides'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'side me'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'flex-block'
      }, VirtualDOM.createVirtualElement("p", null, fight.parties.me?.name, "(x", fight.parties.me?.quantity, ")"), VirtualDOM.createVirtualElement("p", {
        className: 'item-with-icon'
      }, VirtualDOM.createVirtualElement("img", {
        src: `${HTTP_PATH}static/icons/battle/hp.png`
      }), fmtVal(fight.parties.me?.realHP))), VirtualDOM.createVirtualElement(ProgressBar, {
        progress: fight.parties.me?.realHP,
        max: fight.parties.me?.maxRealHP,
        className: 'blue'
      }), VirtualDOM.createVirtualElement("div", {
        className: 'flex-block'
      }, VirtualDOM.createVirtualElement("p", {
        className: 'item-with-icon'
      }, VirtualDOM.createVirtualElement("img", {
        src: `${HTTP_PATH}static/icons/battle/attack.png`
      }), fmtVal(fight.parties.me?.damage)), VirtualDOM.createVirtualElement("p", {
        className: 'item-with-icon'
      }, VirtualDOM.createVirtualElement("img", {
        src: `${HTTP_PATH}static/icons/battle/defense.png`
      }), fmtVal(fight.parties.me?.defense)))), VirtualDOM.createVirtualElement("h2", null, "VS"), VirtualDOM.createVirtualElement("div", {
        className: 'side enemy'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'flex-block'
      }, VirtualDOM.createVirtualElement("p", null, fight.parties.enemy?.name), VirtualDOM.createVirtualElement("p", null, "HP: ", fmtVal(fight.parties.enemy?.realHP), " (x", fight.parties.enemy?.quantity, ")")), VirtualDOM.createVirtualElement(ProgressBar, {
        progress: fight.parties.enemy?.realHP,
        max: fight.parties.enemy?.maxRealHP,
        className: 'blue'
      }), VirtualDOM.createVirtualElement("div", {
        className: 'flex-block'
      }, VirtualDOM.createVirtualElement("p", {
        className: 'item-with-icon'
      }, VirtualDOM.createVirtualElement("img", {
        src: `${HTTP_PATH}static/icons/battle/attack.png`
      }), fmtVal(fight.parties.enemy?.damage)), VirtualDOM.createVirtualElement("p", {
        className: 'item-with-icon'
      }, VirtualDOM.createVirtualElement("img", {
        src: `${HTTP_PATH}static/icons/battle/defense.png`
      }), fmtVal(fight.parties.enemy?.defense))))));
    };
    const Battle = () => {
      const map = State.queryState('game.battle.map', {});
      const fight = State.queryState('game.battle.fight', {});
      return VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement(MapInfo, {
        map: { ...map
        }
      }), VirtualDOM.createVirtualElement(Fight, {
        fight: fight,
        map: { ...map
        }
      }));
    };

    var css_248z$4 = "\r\n.settings-wrap {\r\n    background: #030304;\r\n    padding: 20px;\r\n}\r\n\r\n.sett-inner {\r\n    max-width: 500px;\r\n}\r\n\r\n#save-text {\r\n    width: 400px;\r\n    margin-bottom: 10px;\r\n    resize: none;\r\n    /*width: 0;\r\n    height: 0;\r\n    padding: 0;\r\n    margin: 0;\r\n    border: 0;*/\r\n}\r\n\r\n.options .row {\r\n    display: flex;\r\n}\r\n\r\n.options .row .set-title {\r\n    width: 300px;\r\n}";
    styleInject(css_248z$4);

    const switchSetting = (path, value) => {
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
      onClick: useCiCallback((path, value) => switchSetting(path, value), [path, !value])
    }, value ? 'On' : 'Off');
    const GameSettings = ({
      settings
    }) => {
      return VirtualDOM.createVirtualElement("div", {
        className: 'options'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'section'
      }, VirtualDOM.createVirtualElement("h5", null, "Notifications Settings"), VirtualDOM.createVirtualElement("div", {
        className: 'row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'set-title'
      }, VirtualDOM.createVirtualElement("p", null, "Show notification when creature dies")), VirtualDOM.createVirtualElement("div", {
        className: 'set-setting'
      }, VirtualDOM.createVirtualElement(Switcher, {
        path: 'notificationsSettings.whenCreatureDies',
        value: settings.notificationsSettings?.whenCreatureDies
      }))), VirtualDOM.createVirtualElement("div", {
        className: 'row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'set-title'
      }, VirtualDOM.createVirtualElement("p", null, "Show notification when zone finished")), VirtualDOM.createVirtualElement("div", {
        className: 'set-setting'
      }, VirtualDOM.createVirtualElement(Switcher, {
        path: 'notificationsSettings.whenZoneFinished',
        value: settings.notificationsSettings?.whenZoneFinished
      }))), VirtualDOM.createVirtualElement("div", {
        className: 'row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'set-title'
      }, VirtualDOM.createVirtualElement("p", null, "Show notification when battle lost")), VirtualDOM.createVirtualElement("div", {
        className: 'set-setting'
      }, VirtualDOM.createVirtualElement(Switcher, {
        path: 'notificationsSettings.whenBattleLost',
        value: settings.notificationsSettings?.whenBattleLost
      }))), VirtualDOM.createVirtualElement("div", {
        className: 'row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'set-title'
      }, VirtualDOM.createVirtualElement("p", null, "Show notification when battle won")), VirtualDOM.createVirtualElement("div", {
        className: 'set-setting'
      }, VirtualDOM.createVirtualElement(Switcher, {
        path: 'notificationsSettings.whenBattleWon',
        value: settings.notificationsSettings?.whenBattleWon
      }))), VirtualDOM.createVirtualElement("div", {
        className: 'row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'set-title'
      }, VirtualDOM.createVirtualElement("p", null, "Show notification when building built")), VirtualDOM.createVirtualElement("div", {
        className: 'set-setting'
      }, VirtualDOM.createVirtualElement(Switcher, {
        path: 'notificationsSettings.whenBuildingBuilt',
        value: settings.notificationsSettings?.whenBuildingBuilt
      })))), VirtualDOM.createVirtualElement("div", {
        className: 'section'
      }, VirtualDOM.createVirtualElement("h5", null, "Confirmation Settings"), VirtualDOM.createVirtualElement("div", {
        className: 'row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'set-title'
      }, VirtualDOM.createVirtualElement("p", null, "Show confirmation when go negative balance after assign creature jobs")), VirtualDOM.createVirtualElement("div", {
        className: 'set-setting'
      }, VirtualDOM.createVirtualElement(Switcher, {
        path: 'confirmationSettings.whenGoNegative',
        value: settings.confirmationSettings?.whenGoNegative
      })))), VirtualDOM.createVirtualElement("div", {
        className: 'section'
      }, VirtualDOM.createVirtualElement("h5", null, "Input controls"), VirtualDOM.createVirtualElement("div", {
        className: 'row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'set-title'
      }, VirtualDOM.createVirtualElement("p", null, "Show input on creature jobs page as")), VirtualDOM.createVirtualElement("div", {
        className: 'set-setting'
      }, VirtualDOM.createVirtualElement("select", {
        onChange: useCiCallback((path, e) => switchSetting(path, e.target.value), ['inputControls.creatureJobs'])
      }, VirtualDOM.createVirtualElement("option", {
        value: 'buttons',
        selected: settings.inputControls?.creatureJobs === 'buttons'
      }, "Buttons"), VirtualDOM.createVirtualElement("option", {
        value: 'slider',
        selected: settings.inputControls?.creatureJobs === 'slider'
      }, "Slider"), VirtualDOM.createVirtualElement("option", {
        value: 'both',
        selected: settings.inputControls?.creatureJobs === 'both'
      }, "Both"))))));
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
      return VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement("div", {
        className: 'settings-wrap'
      }, VirtualDOM.createVirtualElement(ImportExport, null)), VirtualDOM.createVirtualElement("div", {
        className: 'settings-wrap'
      }, VirtualDOM.createVirtualElement(GameSettings, {
        settings: settings
      })));
    };

    var css_248z$3 = "\n.story-row {\n    background: #030304;\n    padding: 20px;\n    margin: 10px;\n}\n\n.goal-title {\n    font-weight: bold;\n}";
    styleInject(css_248z$3);

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

    var css_248z$2 = ".buildings {\r\n    padding: 10px;\r\n    background: #030304;\r\n}\r\n\r\n.building-wrapper {\r\n    padding: 10px;\r\n}\r\n\r\n.build-wrap {\r\n    width: 150px;\r\n}\r\n\r\n.building-wrapper .description {\r\n    width: 400px;\r\n}";
    styleInject(css_248z$2);

    const doBuild = id => {
      console.log('do build', id);
      ColibriClient.sendToWorker('do_build', {
        id
      });
    };

    ColibriClient.on('set_buildings_state', payload => {
      State.setState('game.buildings.data', payload);
    });
    const BuildingsComponent = ({
      buildings
    }) => VirtualDOM.createVirtualElement("div", {
      className: 'buildings'
    }, buildings ? buildings.map(one => VirtualDOM.createVirtualElement("div", {
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
    }, one.isPurchased ? VirtualDOM.createVirtualElement("div", {
      className: 'progress-wrap-bld'
    }, VirtualDOM.createVirtualElement("p", null, "Progress:"), VirtualDOM.createVirtualElement(ProgressBar, {
      progress: one.buildingProgress,
      max: one.maxBuildingProgress
    })) : VirtualDOM.createVirtualElement("span", null), VirtualDOM.createVirtualElement("button", {
      className: 'main-action',
      onClick: useCiCallback(id => doBuild(id), [one.id]),
      disabled: !one.isAvailable && !one.isPurchased || one.inProgress
    }, one.isPurchased ? `${one.inProgress ? 'Building' : 'Continue'}` : `Build`)))) : VirtualDOM.createVirtualElement("p", null, "No buildings available"));
    const Buildings = () => {
      const buildings = State.queryState('game.buildings.data', []);
      return VirtualDOM.createVirtualElement("div", {
        className: 'building-page'
      }, VirtualDOM.createVirtualElement(BuildingsComponent, {
        buildings: buildings?.filter(one => one.isUnlocked)
      }));
    };

    const ViewRun = ({
      tabId
    }) => VirtualDOM.createVirtualElement("div", {
      className: 'in-game'
    }, VirtualDOM.createVirtualElement(Sidebar, null), VirtualDOM.createVirtualElement("div", {
      className: 'run-content'
    }, tabId === 'jobs' ? VirtualDOM.createVirtualElement(Jobs, null) : null, tabId === 'shop' ? VirtualDOM.createVirtualElement(Shop, null) : null, tabId === 'creatures' ? VirtualDOM.createVirtualElement(Creatures, null) : null, tabId === 'learning' ? VirtualDOM.createVirtualElement(Learning, null) : null, tabId === 'banners' ? VirtualDOM.createVirtualElement(Banners, null) : null, tabId === 'research' ? VirtualDOM.createVirtualElement(Research, null) : null, tabId === 'battle' ? VirtualDOM.createVirtualElement(Battle, null) : null, tabId === 'building' ? VirtualDOM.createVirtualElement(Buildings, null) : null, tabId === 'story' ? VirtualDOM.createVirtualElement(StoryPage, null) : null, tabId === 'settings' ? VirtualDOM.createVirtualElement(Settings, null) : null));
    const RunScreen = () => {
      const tabId = State.queryState('ui.navigation.page', 'jobs');
      return VirtualDOM.createVirtualElement(ViewRun, {
        tabId: tabId
      });
    };

    const Content = () => VirtualDOM.createVirtualElement(RunScreen, null);

    var css_248z$1 = "h1 {\r\n    padding-left: 20px;\r\n}\r\n\r\nbody * {\r\n    box-sizing: border-box;\r\n}\r\n\r\nbody {\r\n    margin: 0;\r\n    padding: 0;\r\n    background: #121520;\r\n    color: #fff;\r\n    /*font-family: \"Century Gothic\";*/\r\n    font-family: 'Didact Gothic', sans-serif;\r\n    font-size: 13px;\r\n}\r\n\r\np {\r\n    margin-block-start: 0.75em;\r\n    margin-block-end: 0.75em;\r\n}\r\n\r\n.flex {\r\n    display: flex;\r\n    justify-content: space-between;\r\n    align-items: center;\r\n}\r\n\r\nbutton {\r\n    color: #ffffff;\r\n    cursor: pointer;\r\n}\r\n\r\nbutton.main-action {\r\n    background: linear-gradient(#512159, #613169, #512159);\r\n    padding: 5px 10px;\r\n    border: 1px solid #411149;\r\n    border-radius: 3px;\r\n}\r\n\r\nbutton.main-action:hover {\r\n    background: linear-gradient(#411149, #512159, #411149);\r\n}\r\n\r\nbutton.main-action:disabled {\r\n    background: #130314;\r\n    color: #989\r\n}\r\n\r\n.hint {\r\n    position: fixed;\r\n    bottom: 40px;\r\n    left: 10px;\r\n    background: #000;\r\n    color: #fff;\r\n    padding: 20px;\r\n    font-size: 13px;\r\n    border-radius: 5px;\r\n}\r\n\r\n.modal-wrap {\r\n    position: fixed;\r\n    top: 0;\r\n    left: 0;\r\n    width: 100%;\r\n    height: 100%;\r\n    background: rgba(30,30,30,0.6);\r\n}\r\n\r\n.modal-wrap .modal {\r\n    margin: 10% auto auto;\r\n    width: 50%;\r\n    height: 60%;\r\n    position: relative;\r\n    background: #070814;\r\n    padding: 20px;\r\n}\r\n\r\n.modal-wrap .modal.confirm-modal {\r\n    max-height: 500px;\r\n    min-height: 200px;\r\n}\r\n\r\n.modal-wrap .modal .modal-body {\r\n    overflow-y: scroll;\r\n    height: calc(100% - 90px);\r\n}\r\n\r\n.modal-wrap .modal.confirm-modal .modal-body {\r\n    overflow-y: auto;\r\n}\r\n\r\n.modal-wrap .modal .note {\r\n    font-style: italic;\r\n    color: #aaa;\r\n}\r\n\r\n.modal-wrap .modal .close {\r\n    cursor: pointer;\r\n}\r\n\r\n.resource-item {\r\n    display: flex;\r\n}\r\n\r\n.resource-item .missing {\r\n    color: #ad2121;\r\n}\r\n\r\n.resource-icon-wrap {\r\n    width: 16px;\r\n    height: 16px;\r\n    display: inline-block;\r\n    margin-right: 0.25em;\r\n}\r\n\r\n.icon-wrap img{\r\n    object-fit: contain;\r\n    width: 100%;\r\n}\r\n\r\n.resource-icon-wrap img {\r\n    width: 100%;\r\n    object-fit: contain;\r\n}\r\n\r\n.progress-wrap {\r\n    padding: 0.75em;\r\n}\r\n\r\n.progress-wrap .outer-span {\r\n    background: #121520;\r\n    height: 8px;\r\n    border-radius: 4px;\r\n    border: 1px solid #444;\r\n}\r\n\r\n.progress-wrap .outer-span .inner-span{\r\n    height: 100%;\r\n    border-radius: 4px;\r\n    background: linear-gradient(#713169, #915189, #713169);\r\n}\r\n\r\n.progress-wrap .outer-span.blue .inner-span{\r\n    height: 100%;\r\n    border-radius: 4px;\r\n    background: linear-gradient(#7191b9, #7191d9, #7191b9);\r\n}\r\n\r\n.popup-link {\r\n    color: #f171a9;\r\n    text-decoration: underline;\r\n    cursor: pointer;\r\n    margin-right: 10px;\r\n    margin-left: 10px;\r\n}\r\n\r\n.link {\r\n    color: #f171a9;\r\n    text-decoration: underline;\r\n    cursor: pointer;\r\n}\r\n\r\n.padded {\r\n    margin: 16px 0;\r\n}\r\n\r\n.notifications-wrapper {\r\n    top: 0;\r\n    right: 0;\r\n    position: fixed;\r\n    z-index: 4;\r\n}\r\n\r\n.notifications-wrapper .notification {\r\n    border-radius: 5px;\r\n    padding: 3px 5px;\r\n    margin: 3px;\r\n}\r\n\r\n.confirmation-popup-body .description{\r\n    height: calc(100% - 60px);\r\n}";
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
    }, VirtualDOM.createVirtualElement("h4", null, "Version 0.1.1 (30.10.2022)"), VirtualDOM.createVirtualElement("ul", null, VirtualDOM.createVirtualElement("li", null, "Updated UI for creature jobs selectors"), VirtualDOM.createVirtualElement("li", null, "Added ability to revert banners convesion"), VirtualDOM.createVirtualElement("li", null, "Added 2 new researches"), VirtualDOM.createVirtualElement("li", null, "Added new building"), VirtualDOM.createVirtualElement("li", null, "Fixed bugs when some buildings had no effect"), VirtualDOM.createVirtualElement("li", null, "Added notification settings")), VirtualDOM.createVirtualElement("h4", null, "Version 0.1.0 (29.10.2022)"), VirtualDOM.createVirtualElement("ul", null, VirtualDOM.createVirtualElement("li", null, "Added possibility to select your temper on prestige (providing certain bonuses to next run)"), VirtualDOM.createVirtualElement("li", null, "Banners tab now allows to convert 10% of your previous tier"), VirtualDOM.createVirtualElement("li", null, "Added new early-game shop items providing more automation and bigger bonuses to energe regeneration"), VirtualDOM.createVirtualElement("li", null, "Added more than 10 new researches, including ones that will make starting runs easier"), VirtualDOM.createVirtualElement("li", null, "Added new buildings"), VirtualDOM.createVirtualElement("li", null, "Increased fighting rewards"), VirtualDOM.createVirtualElement("li", null, "Improved UI (sidebar, learning controls, and other small fixes/improvements)"), VirtualDOM.createVirtualElement("li", null, "Added \"Purchase all available\" button in shop")), VirtualDOM.createVirtualElement("h4", null, "Version 0.0.4 (26.10.2022)"), VirtualDOM.createVirtualElement("ul", null, VirtualDOM.createVirtualElement("li", null, "Added building mechanics (basics)"), VirtualDOM.createVirtualElement("li", null, "Added possibility to show purchased shop items"), VirtualDOM.createVirtualElement("li", null, "Fixed bug when converting banners caused rewrite instead of add amount"), VirtualDOM.createVirtualElement("li", null, "Fixed bug when green banner didn't affected gold from work on stable"), VirtualDOM.createVirtualElement("li", null, "Fixed export game issues (copy to buffer)")), VirtualDOM.createVirtualElement("h4", null, "Version 0.0.3 (22.10.2022)"), VirtualDOM.createVirtualElement("ul", null, VirtualDOM.createVirtualElement("li", null, "Balance update: increased max mana gain by courses, decreased tireless research effect"), VirtualDOM.createVirtualElement("li", null, "Added story page with current and passed milestones"), VirtualDOM.createVirtualElement("li", null, "Added resource balance to sidebar"), VirtualDOM.createVirtualElement("li", null, "Effects of all actions and spells are now shown"), VirtualDOM.createVirtualElement("li", null, "Improved shop items descriptions"), VirtualDOM.createVirtualElement("li", null, "Fixed grammar mistakes"), VirtualDOM.createVirtualElement("li", null, "Fixed bug when some content was not visible under specific screen resolutions")), VirtualDOM.createVirtualElement("h4", null, "Version 0.0.2 (21.10.2022)"), VirtualDOM.createVirtualElement("ul", null, VirtualDOM.createVirtualElement("li", null, "Added new researches"), VirtualDOM.createVirtualElement("li", null, "Added battle mechanics"), VirtualDOM.createVirtualElement("li", null, "Added researcher banner"), VirtualDOM.createVirtualElement("li", null, "UI fixes"))), VirtualDOM.createVirtualElement("div", {
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

        case 'story':
          ColibriClient.sendToWorker('get_story_tab');
          break;

        case 'building':
          ColibriClient.sendToWorker('get_buildings_tab');
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
