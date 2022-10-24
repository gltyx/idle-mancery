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
          console.warn('DEBUG: ', elem, attrs, children);
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
        return typeof val === undefined ? def : val;
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
          if (!prevNode?.listeners?.[key]) {
            if (typeof listener === 'function') {
              currentNode.listeners[key] = {
                currCb: listener,
                realCb: listener
              };
            } else {
              currentNode.listeners[key] = {
                realCb: event => {
                  console.log('triggered ', key, ' with params ', listener.deps, ' was setup from init');
                  listener.currCb(...(listener.deps || []), event);
                },
                currCb: listener.currCb,
                deps: listener.deps
              };
            }

            console.log('UPDATING LISTENER CAUSE PREV LISTENER WAS NOT EXISTING');
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

      static checkShouldUpdate(DOMNode, prevDOMNode, parent, path = 'root') {
        DOMNode.shouldUpdate = false;

        if (DOMNode.type === 'component') {
          DOMNode.componentId = `${path}.${DOMNode.name}`;

          if (parent) {
            parent.hasChildComponents = true;
          }
        }

        if (UpdateChecker.checkAbortNode(DOMNode, prevDOMNode, parent)) {
          return true;
        }
        /*if(['html', 'text'].includes(DOMNode.type) && prevDOMNode.type === 'component') {
            DOMNode.isReplaceComponent = true;
        }*/


        if (prevDOMNode && DOMNode.type !== prevDOMNode.type || parent?.isReplaceComponent) {
          DOMNode.isReplaceComponent = true;
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
              console.log('index: ', index, DOMNode.children, prevDOMNode.children);
              DOMNode.children.push({
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

      static renderHTML(DOMNode, parent, parentDOM) {
        // console.log('rendering', DOMNode, parent);
        if (typeof DOMNode !== 'object') {
          return DOMNode;
        }

        if (DOMNode.shouldUpdate) {
          if (['html', 'text'].includes(DOMNode.type)) {
            if (DOMNode.removedItem && DOMNode.ref) {
              console.log('deleting', DOMNode);
              DOMNode.ref.remove();
              delete DOMNode.ref;
              return;
            }

            if (DOMNode.isReplaceComponent) {
              console.log('isReplaceComponent: ', DOMNode.ref);

              if (DOMNode.ref) {
                DOMNode.ref.remove();
                delete DOMNode.ref;
              }

              console.log('afterDeleting: ', DOMNode.ref);
            }

            const oldRef = DOMNode.ref;

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
            }); // console.log('domNodeUpdate: ', DOMNode, oldRef, parent);

            if (DOMNode.ref) {
              try {
                if (!oldRef) {
                  parent.append(DOMNode.ref);
                } else {
                  if (oldRef.childNodes.length && DOMNode.type === 'html') {
                    DOMNode.ref.append(...oldRef.childNodes);
                  }

                  parent.replaceChild(DOMNode.ref, oldRef);
                }
              } catch (e) {
                console.error(e, oldRef);
                console.error('args: ', DOMNode, parent, parentDOM);
                parent.append(DOMNode.ref);
              }
            }

            if (DOMNode.children) {
              DOMNode.children.map(one => RealDom.renderHTML(one, DOMNode.ref, DOMNode)); // RealDom.handleDOMNodeEvents(DOMNode);
            }
          }

          if (DOMNode.type === 'component') {
            if (DOMNode.ref) {
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
              if (value.prealCb !== value.realCb) {
                console.warn('WARN! CB was changed on item ', DOMNode.ref);
              }

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


        RealDom.renderHTML(VirtualDOM.DOMNodes, document.getElementById(id)); // console.log('afterRender: ', JSON.stringify(VirtualDOM.DOMNodes, ' ', 1));
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
        battle: general.battleUnlocked
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

    var css_248z$c = ".footer {\n    position: fixed;\n    height: 40px;\n    background: #030304;\n    border-top: 1px solid #333;\n    padding: 5px;\n    bottom: 0;\n    width: 100%;\n}\n.menu-wrap {\n    width: 100%;\n    background: #000;\n    padding-left: 20px;\n}\n\n.menu {\n    display: flex;\n}\n\n.menu-item {\n    padding: 10px 12px;\n    cursor: pointer;\n    margin: 0;\n}\n\n.menu-item.selected,\n.menu-item:hover {\n    background: #111119;\n    font-weight: bold;\n}\n\n.header {\n    position: fixed;\n    top: 0px;\n    background: #121520;\n    width: 100%;\n}\n\n.locked {\n    color: #aaa;\n    padding: 10px 12px;\n    margin: 0;\n}";
    styleInject(css_248z$c);

    const ModalUI = ({
      modalId,
      className,
      title,
      actions,
      children
    }) => VirtualDOM.createVirtualElement("div", {
      className: 'modal-wrap'
    }, VirtualDOM.createVirtualElement("div", {
      className: `modal ${className}`
    }, VirtualDOM.createVirtualElement("div", {
      className: 'modal-header flex'
    }, VirtualDOM.createVirtualElement("h2", null, title), VirtualDOM.createVirtualElement("span", {
      className: 'close',
      onClick: useCiCallback(id => State.setState(`ui.modal.${id}`, false), [modalId])
    }, "X")), VirtualDOM.createVirtualElement("div", {
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
      actions
    }, children) => {
      const isOpened = State.queryState(`ui.modal.${modalId}`);
      if (!isOpened) return null;
      return VirtualDOM.createVirtualElement(ModalUI, {
        modalId: modalId,
        className: className,
        title: title,
        actions: actions,
        children: children
      });
    };
    const showModal = id => State.setState(`ui.modal.${id}`, true);

    const showVersion = () => showModal('version');

    const showAbout = () => showModal('about');

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

    const FooterUI = ({
      general
    }) => VirtualDOM.createVirtualElement("div", {
      className: 'footer flex'
    }, VirtualDOM.createVirtualElement("div", {
      className: 'flex'
    }, VirtualDOM.createVirtualElement("p", {
      className: 'popup-link',
      onClick: showVersion
    }, "v0.0.3"), VirtualDOM.createVirtualElement("p", {
      className: 'popup-link',
      onClick: showAbout
    }, "About")), VirtualDOM.createVirtualElement("p", null, "Time spent: ", secondsToHms(general?.timeSpent)));
    const Footer = () => {
      const general = State.queryState('game.general', {});
      return VirtualDOM.createVirtualElement(FooterUI, {
        general: general
      });
    };

    var css_248z$b = ".sidebar {\n    margin-right: 20px;\n    background: #000000;\n    padding: 20px;\n    width: 280px;\n    flex-shrink: 0;\n    min-height: calc(100vh - 180px);\n}\n\n.sidebar .resourceName {\n    width: 80px;\n    display: inline-block;\n}\n\n.resource-line {\n    display: flex;\n}\n\n.resource-line .income {\n    font-size: 12px;\n    margin-left: 5px;\n}\n\n.resource-line .income.positive {\n    color: #53a862;\n}\n\n.resource-line .income.negative {\n    color: #ad2121;\n}";
    styleInject(css_248z$b);

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

    const ResourceItem = ({
      id,
      name,
      amount,
      max,
      income,
      incomeText
    }) => VirtualDOM.createVirtualElement("p", {
      resourceId: id,
      className: 'resource-line'
    }, VirtualDOM.createVirtualElement(ResourceIcon, {
      id: id
    }), VirtualDOM.createVirtualElement("span", {
      className: 'resourceName'
    }, name), VirtualDOM.createVirtualElement("span", {
      className: 'resourceAmount'
    }, fmtVal(amount)), max ? VirtualDOM.createVirtualElement("span", {
      className: 'resourceMax'
    }, " / ", fmtVal(max)) : null, income ? VirtualDOM.createVirtualElement("span", {
      className: `income ${income > 0 ? 'positive' : 'negative'}`
    }, income > 0 ? '+' : '', incomeText) : null);
    const SidebarUI = ({
      resources
    }) => VirtualDOM.createVirtualElement("div", {
      className: 'sidebar'
    }, resources ? resources.filter(one => one.isUnlocked).map(rs => VirtualDOM.createVirtualElement(Tooltip, {
      id: `res_${rs.id}`,
      tooltipText: `Income: ${rs.income || 0} / s`
    }, VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement(ResourceItem, rs)))) : VirtualDOM.createVirtualElement("span", null, "Loading..."));
    const Sidebar = () => {
      const resources = State.queryState('game.resources');
      return VirtualDOM.createVirtualElement(SidebarUI, {
        resources: resources
      });
    };

    var css_248z$a = ".in-game {\n    display: flex;\n    padding: 20px;\n    margin-top: 100px;\n}\n\n.run-content {\n    flex: 1;\n    margin-bottom: 50px;\n}";
    styleInject(css_248z$a);

    var css_248z$9 = ".actions {\n    display: flex;\n    flex-wrap: wrap;\n    justify-content: flex-start;\n}\n\n.action-wrapper {\n    width: 260px;\n    text-align: center;\n    margin: 5px;\n    padding: 10px;\n    background: #030304;\n}\n\n.action-wrapper button {\n    margin: 10px auto auto;\n    width: 180px;\n}\n\n.action-wrapper .produces,\n.action-wrapper .costs {\n    display: flex;\n    padding-left: 50px;\n}\n\n.action-wrapper .produces .resourceList,\n.action-wrapper .costs .resourceList {\n    padding-left: 10px;\n}\n\n.custom-gain {\n    margin-left: 5px;\n}";
    styleInject(css_248z$9);

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
      className: 'custom-gain'
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

    var css_248z$8 = ".shop-items {\n    display: flex;\n    flex-wrap: wrap;\n    justify-content: flex-start;\n}\n\n.shop-item-wrapper {\n    width: 260px;\n    text-align: center;\n    margin: 5px;\n    padding: 10px;\n    background: #030304;\n}\n\n.shop-item-wrapper button {\n    margin: auto;\n    width: 140px;\n}\n\n.item-resources {\n    padding-left: 50px;\n}";
    styleInject(css_248z$8);

    const makePurchase = id => {
      ColibriClient.sendToWorker('do_purchase', id);
    };

    ColibriClient.on('set_shopitems_state', payload => {
      State.setState('game.shop.items', payload);
    });
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
        disabled: !one.isAvailable
      }, one.name))) : VirtualDOM.createVirtualElement("p", null, "No purchases available"));
    };
    const Shop = () => {
      const items = State.queryState('game.shop.items');
      return VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement(ShopItemComponent, {
        items: items
      }));
    };

    var css_248z$7 = ".summon-creature {\n    display: flex;\n    justify-content: flex-start;\n    background: #030304;\n    padding: 20px;\n    width: 100%;\n}\n\n.summon-creature .change-amount {\n    margin-right: 10px;\n    margin-left: auto;\n}\n\n.summon-creature .cost-wrap {\n    margin-left: 20px;\n}\n\n.work-places {\n    background: #030304;\n    padding: 10px;\n}\n\n.work-places .job-row {\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n}\n.work-places .job-row > div {\n    width: 250px;\n}\n\n.work-places .job-row .actions {\n    align-items: center;\n    justify-content: space-around;\n}\n\n.creature-notes {\n    margin-left: 20px;\n    flex: 1;\n}\n\n.summon-wrap {\n    min-width: 120px;\n}";
    styleInject(css_248z$7);

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

    ColibriClient.on('set_creatures_state', payload => {
      State.setState('game.creatures.summon', payload);
    });
    ColibriClient.on('set_creatures_jobs_state', payload => {
      State.setState('game.creatures.jobs', payload);
    });
    const CreatureJobs = ({
      jobs,
      freeWorkers,
      amount
    }) => {
      return VirtualDOM.createVirtualElement("div", {
        className: 'work-places'
      }, VirtualDOM.createVirtualElement("p", {
        className: 'free-amt'
      }, "Free workers:  ", freeWorkers), VirtualDOM.createVirtualElement("div", {
        className: 'job-rows'
      }, jobs ? jobs.map(one => VirtualDOM.createVirtualElement("div", {
        className: 'job-row'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'name'
      }, VirtualDOM.createVirtualElement("p", null, one.name)), VirtualDOM.createVirtualElement("div", {
        className: 'income'
      }, VirtualDOM.createVirtualElement("p", null, "Produce: "), VirtualDOM.createVirtualElement(ResourcesList, {
        data: one.gain
      })), VirtualDOM.createVirtualElement("div", {
        className: 'outcome'
      }, VirtualDOM.createVirtualElement("p", null, "Consume: "), VirtualDOM.createVirtualElement(ResourcesList, {
        data: one.cost
      })), VirtualDOM.createVirtualElement("div", {
        className: 'actions'
      }, VirtualDOM.createVirtualElement("button", {
        className: 'main-action',
        onClick: useCiCallback((id, amount) => changeWorkes(id, -amount), [one.id, amount])
      }, "-", amount), VirtualDOM.createVirtualElement("span", null, one.current), VirtualDOM.createVirtualElement("button", {
        className: 'main-action',
        onClick: useCiCallback((id, amount) => changeWorkes(id, amount), [one.id, amount])
      }, "+", amount)))) : VirtualDOM.createVirtualElement("p", null, "No jobs available")));
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
      const jobs = State.queryState('game.creatures.jobs');
      return VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement(SummonCreature, {
        info: info
      }), VirtualDOM.createVirtualElement(CreatureJobs, {
        jobs: jobs?.jobs,
        freeWorkers: jobs?.free,
        amount: info.amount
      }));
    };

    var css_248z$6 = "\n.skills-container {\n    background: #030304;\n    padding: 20px;\n}\n\n.skills-container .skill-row {\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n}\n.skills-container .skill-row > div {\n    width: 200px;\n}\n\n.skills-container .skill-row .xp-bar {\n    width: 300px;\n}\n\n.skills-container .skill-row .xp-bar .outer-span {\n    width: 300px;\n}\n.skills-container .skill-row .xp-bar .tiny {\n    font-size: 12px;\n    text-align: right;\n    margin: 0;\n}\n\n\n.skills-container .skill-row .actions {\n\n}";
    styleInject(css_248z$6);

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

    const changeEfforts = (id, e) => {
      console.log('change_learning_efforts', {
        id,
        efforts: e.target.value
      });
      ColibriClient.sendToWorker('change_learning_efforts', {
        id,
        efforts: e.target.value
      });
    };

    ColibriClient.on('set_skills_state', payload => {
      State.setState('game.learning.skills', payload);
    });
    const Skills = ({
      skills
    }) => {
      return VirtualDOM.createVirtualElement("div", {
        className: 'skills-container'
      }, VirtualDOM.createVirtualElement("div", {
        className: 'skills-rows'
      }, skills ? skills.map(one => VirtualDOM.createVirtualElement("div", {
        className: 'skill-row'
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
      }, VirtualDOM.createVirtualElement("p", null, "Set energy spent"), VirtualDOM.createVirtualElement("input", {
        type: 'number',
        value: one.efforts,
        onChange: useCiCallback((id, e) => changeEfforts(id, e), [one.id])
      })))) : VirtualDOM.createVirtualElement("p", null, "No skills available")));
    };
    const Learning = () => {
      const skills = State.queryState('game.learning.skills', []);
      return VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement(Skills, {
        skills: skills?.filter(one => one.isUnlocked)
      }));
    };

    var css_248z$5 = "\n.banners-container {\n    background: #030304;\n    padding: 10px;\n}\n\n.banners-container .banners-row {\n    display: flex;\n    justify-content: space-between;\n}\n\n.banners-container .tiers-row {\n    display: flex;\n    justify-content: flex-start;\n    align-items: center;\n}\n.banners-container .tiers-row > .banner-box {\n    width: 150px;\n    height: 150px;\n}\n\n.inner-banner {\n    padding-left: 10px;\n}\n\n.inner-banner .amount {\n    font-weight: bold;\n    font-size: 15px;\n}\n\n.skills-container .skill-row .actions {\n\n}\n\n.banners-note {\n    /* font-style: italic; */\n}";
    styleInject(css_248z$5);

    const prestige = id => {
      console.log('prestieging', id);
      ColibriClient.sendToWorker('do_prestige', id);
    };

    const convert = (id, tierIndex) => {
      console.log('converting', id, tierIndex);
      ColibriClient.sendToWorker('do_convert', {
        id,
        tierIndex
      });
    };

    ColibriClient.on('set_banners_state', payload => {
      State.setState('game.banners.data', payload);
    });
    const BannerRow = ({
      banner
    }) => VirtualDOM.createVirtualElement("div", {
      className: 'banner-box'
    }, VirtualDOM.createVirtualElement("div", {
      className: 'info'
    }, VirtualDOM.createVirtualElement("h5", null, banner.name), VirtualDOM.createVirtualElement("p", null, banner.description)), VirtualDOM.createVirtualElement("div", {
      className: 'tiers-row'
    }, banner.tiers ? banner.tiers.map((tier, index) => VirtualDOM.createVirtualElement("div", {
      className: 'banner-box'
    }, VirtualDOM.createVirtualElement("div", {
      className: 'inner-banner',
      style: `border-left: 10px solid ${banner.color};`
    }, VirtualDOM.createVirtualElement("p", null, "Tier ", index), VirtualDOM.createVirtualElement("span", {
      className: 'amount'
    }, tier.amount), VirtualDOM.createVirtualElement("p", null, (tier.effectCumulative * 100).toFixed(2), "%")), VirtualDOM.createVirtualElement("div", null, tier.canPrestige ? VirtualDOM.createVirtualElement("button", {
      className: 'main-action',
      onClick: useCiCallback(id => prestige(id), [banner.id])
    }, "Prestige (+", fmtVal(tier.maxConversion), ")") : null, tier.isConvertable ? VirtualDOM.createVirtualElement("button", {
      className: 'main-action',
      onClick: useCiCallback((id, tierIndex) => convert(id, tierIndex), [banner.id, index])
    }, "Convert (+", fmtVal(tier.maxConversion), ")") : null))) : null));
    const BannersUI = ({
      banners
    }) => {
      return VirtualDOM.createVirtualElement("div", {
        className: 'banners-container'
      }, VirtualDOM.createVirtualElement("p", {
        className: 'banners-note'
      }, "By prestieging you will loose all your skills, spells, actions and shop items. But, you will gain some amount of tier 1 banners you selected. The amount depends on currently summoned creatures you have."), VirtualDOM.createVirtualElement("p", {
        className: 'banners-note'
      }, "Each banner type have several tiers. Each tier after first multiplies effect of previous one. By converting to higher tier you will loose all previous tier banners. For example, converting 2-nd tier to 3-rd will remove 2-nd tier banners, add 5 times smaller amount to 3-rd tier. Other tiers will keep the same."), banners ? banners.map(one => VirtualDOM.createVirtualElement(BannerRow, {
        banner: one
      })) : null);
    };
    const Banners = () => {
      const banners = State.queryState('game.banners.data', []);
      return VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement(BannersUI, {
        banners: banners?.filter(one => one.isUnlocked)
      }));
    };

    var css_248z$4 = ".researches {\n    display: flex;\n    flex-wrap: wrap;\n    justify-content: flex-start;\n}\n\n.research-wrapper {\n    width: 260px;\n    text-align: center;\n    margin: 5px;\n    padding: 10px;\n    background: #030304;\n}\n\n.research-wrapper button {\n    margin: 10px auto auto;\n    width: 140px;\n}\n\n\n.research-wrapper .costs {\n    display: flex;\n    padding-left: 50px;\n}\n\n.research-wrapper .costs .resourceList {\n    padding-left: 10px;\n}";
    styleInject(css_248z$4);

    const doResearch = id => {
      console.log('do research', id);
      ColibriClient.sendToWorker('do_research', id);
    };

    ColibriClient.on('set_research_state', payload => {
      State.setState('game.research.data', payload);
    });
    const ResearchComponent = ({
      research
    }) => VirtualDOM.createVirtualElement("div", {
      className: 'researches'
    }, research ? research.map(one => VirtualDOM.createVirtualElement("div", {
      className: 'research-wrapper'
    }, VirtualDOM.createVirtualElement("h5", null, one.name, " [", one.level, `${one.potential ? ` (+${one.potential})` : ``}`, " ", `${one.max ? `/ ${one.max}` : ``}`, "]"), VirtualDOM.createVirtualElement("p", null, one.description), VirtualDOM.createVirtualElement("div", {
      className: 'costs'
    }, VirtualDOM.createVirtualElement("p", null, "Costs:"), VirtualDOM.createVirtualElement(ResourcesList, {
      data: one.cost
    })), VirtualDOM.createVirtualElement("button", {
      className: 'main-action',
      onClick: useCiCallback(id => doResearch(id), [one.id]),
      disabled: !one.isAvailable
    }, "Research"))) : VirtualDOM.createVirtualElement("p", null, "No researches available"));
    const Research = () => {
      const research = State.queryState('game.research.data', []);
      return VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement(ResearchComponent, {
        research: research?.filter(one => one.isUnlocked)
      }));
    };

    var css_248z$3 = "\n.mapInfo, .fighting {\n    background: #030304;\n    padding: 20px;\n}\n\n.map-settings {\n    display: flex;\n    justify-content: space-between;\n}\n\n.fighting {\n    margin-top: 10px;\n}\n\n.fighting .sides {\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n}\n.sides .side {\n    padding: 10px;\n    margin: 10px;\n    width: 280px;\n}\n\n.sides .side p {\n    margin-block-start: 0.25em;\n    margin-block-end: 0.25em;\n}\n\n.flex-block {\n    display: flex;\n    justify-content: space-between;\n}\n\n.item-with-icon {\n    display: flex;\n}\n\n.item-with-icon img {\n    object-fit: contain;\n    width: 18px;\n    height: 18px;\n    margin-right: 5px;\n}";
    styleInject(css_248z$3);

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
    const MapInfo = ({
      map
    }) => VirtualDOM.createVirtualElement("div", {
      className: 'mapInfo'
    }, VirtualDOM.createVirtualElement("h5", null, "Map [", map.level, "]"), VirtualDOM.createVirtualElement("div", {
      className: 'map-settings'
    }, VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement("p", null, "Progress: ", map.cell, " / 100"), VirtualDOM.createVirtualElement("button", {
      className: 'main-action',
      onClick: toggleMap
    }, map.isTurnedOn ? 'Exit fight' : 'Enter fight')), VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement("p", null, "Toggle auto-next map"), VirtualDOM.createVirtualElement("button", {
      className: 'main-action',
      onClick: toggleForward
    }, map.isTurnedOn ? 'Turn off' : 'Turn on'))));
    const Fight = ({
      fight
    }) => {
      if (!fight.parties) return VirtualDOM.createVirtualElement("p", null, "None");
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
      console.log('map.isTurnedOn: ', map.isTurnedOn);
      return VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement(MapInfo, {
        map: map
      }), VirtualDOM.createVirtualElement(Fight, {
        fight: fight
      }));
    };

    var css_248z$2 = "\n.settings-wrap {\n    background: #030304;\n    padding: 20px;\n}\n\n.sett-inner {\n    max-width: 500px;\n}";
    styleInject(css_248z$2);

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
      navigator.clipboard.writeText(payload);
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
    const ImportExport = () => VirtualDOM.createVirtualElement("div", {
      className: 'sett-inner'
    }, VirtualDOM.createVirtualElement("div", {
      className: 'flex-block'
    }, VirtualDOM.createVirtualElement("p", null, "Export game"), VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement("button", {
      className: 'main-action',
      onClick: saveToBuffer
    }, "Copy to clipboard"), VirtualDOM.createVirtualElement("button", {
      className: 'main-action',
      onClick: saveToFile
    }, "Download as file"))), VirtualDOM.createVirtualElement("div", {
      className: 'flex-block'
    }, VirtualDOM.createVirtualElement("p", null, "Import game"), VirtualDOM.createVirtualElement("div", null, VirtualDOM.createVirtualElement("input", {
      type: 'file',
      className: 'upload-file',
      onChange: uploadFile
    }))));
    const Settings = () => {
      return VirtualDOM.createVirtualElement("div", {
        className: 'settings-wrap'
      }, VirtualDOM.createVirtualElement(ImportExport, null));
    };

    var css_248z$1 = "\n.story-row {\n    background: #030304;\n    padding: 20px;\n    margin: 10px;\n}\n\n.goal-title {\n    font-weight: bold;\n}";
    styleInject(css_248z$1);

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

    const ViewRun = ({
      tabId
    }) => VirtualDOM.createVirtualElement("div", {
      className: 'in-game'
    }, VirtualDOM.createVirtualElement(Sidebar, null), VirtualDOM.createVirtualElement("div", {
      className: 'run-content'
    }, tabId === 'jobs' ? VirtualDOM.createVirtualElement(Jobs, null) : null, tabId === 'shop' ? VirtualDOM.createVirtualElement(Shop, null) : null, tabId === 'creatures' ? VirtualDOM.createVirtualElement(Creatures, null) : null, tabId === 'learning' ? VirtualDOM.createVirtualElement(Learning, null) : null, tabId === 'banners' ? VirtualDOM.createVirtualElement(Banners, null) : null, tabId === 'research' ? VirtualDOM.createVirtualElement(Research, null) : null, tabId === 'battle' ? VirtualDOM.createVirtualElement(Battle, null) : null, tabId === 'story' ? VirtualDOM.createVirtualElement(StoryPage, null) : null, tabId === 'settings' ? VirtualDOM.createVirtualElement(Settings, null) : null));
    const RunScreen = () => {
      const tabId = State.queryState('ui.navigation.page', 'jobs');
      return VirtualDOM.createVirtualElement(ViewRun, {
        tabId: tabId
      });
    };

    const Content = () => VirtualDOM.createVirtualElement(RunScreen, null);

    var css_248z = "h1 {\n    padding-left: 20px;\n}\n\nbody * {\n    box-sizing: border-box;\n}\n\nbody {\n    margin: 0;\n    padding: 0;\n    background: #121520;\n    color: #fff;\n    /*font-family: \"Century Gothic\";*/\n    font-family: 'Didact Gothic', sans-serif;\n    font-size: 13px;\n}\n\np {\n    margin-block-start: 0.75em;\n    margin-block-end: 0.75em;\n}\n\n.flex {\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n}\n\nbutton {\n    color: #ffffff;\n    cursor: pointer;\n}\n\nbutton.main-action {\n    background: linear-gradient(#512159, #613169, #512159);\n    padding: 5px 10px;\n    border: 1px solid #411149;\n    border-radius: 3px;\n}\n\nbutton.main-action:hover {\n    background: linear-gradient(#411149, #512159, #411149);\n}\n\nbutton.main-action:disabled {\n    background: #130314;\n    color: #989\n}\n\n.hint {\n    position: fixed;\n    bottom: 40px;\n    left: 10px;\n    background: #000;\n    color: #fff;\n    padding: 20px;\n    font-size: 13px;\n    border-radius: 5px;\n}\n\n.modal-wrap {\n    position: fixed;\n    top: 0;\n    left: 0;\n    width: 100%;\n    height: 100%;\n    background: rgba(30,30,30,0.6);\n}\n\n.modal-wrap .modal {\n    margin: 10% auto auto;\n    width: 50%;\n    height: 60%;\n    position: relative;\n    background: #070814;\n    padding: 20px;\n}\n\n.modal-wrap .modal .modal-body {\n    overflow-y: scroll;\n    height: calc(100% - 90px);\n}\n\n.modal-wrap .modal .note {\n    font-style: italic;\n    color: #aaa;\n}\n\n.modal-wrap .modal .close {\n    cursor: pointer;\n}\n\n.resource-item {\n    display: flex;\n}\n\n\n.resource-icon-wrap {\n    width: 16px;\n    height: 16px;\n    display: inline-block;\n    margin-right: 0.25em;\n}\n\n.resource-icon-wrap img {\n    width: 100%;\n    object-fit: contain;\n}\n\n.progress-wrap {\n    padding: 0.75em;\n}\n\n.progress-wrap .outer-span {\n    background: #121520;\n    height: 8px;\n    border-radius: 4px;\n    border: 1px solid #444;\n}\n\n.progress-wrap .outer-span .inner-span{\n    height: 100%;\n    border-radius: 4px;\n    background: linear-gradient(#713169, #915189, #713169);\n}\n\n.progress-wrap .outer-span.blue .inner-span{\n    height: 100%;\n    border-radius: 4px;\n    background: linear-gradient(#7191b9, #7191d9, #7191b9);\n}\n\n.popup-link {\n    color: #f171a9;\n    text-decoration: underline;\n    cursor: pointer;\n    margin-right: 10px;\n    margin-left: 10px;\n}\n\n.link {\n    color: #f171a9;\n    text-decoration: underline;\n    cursor: pointer;\n}\n\n.padded {\n    margin: 16px 0;\n}";
    styleInject(css_248z);

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

    const Game = () => VirtualDOM.createVirtualElement("main", null, VirtualDOM.createVirtualElement(Header, null), VirtualDOM.createVirtualElement(Content, null), VirtualDOM.createVirtualElement(Footer, null), VirtualDOM.createVirtualElement(StoryPopup, null), VirtualDOM.createVirtualElement(Modal, {
      modalId: 'version',
      title: 'Version history'
    }, VirtualDOM.createVirtualElement("div", {
      className: 'version-items'
    }, VirtualDOM.createVirtualElement("h4", null, "Version 0.0.3 (22.10.2022)"), VirtualDOM.createVirtualElement("ul", null, VirtualDOM.createVirtualElement("li", null, "Balance update: increased max mana gain by courses, decreased tireless research effect"), VirtualDOM.createVirtualElement("li", null, "Added story page with current and passed milestones"), VirtualDOM.createVirtualElement("li", null, "Added resource balance to sidebar"), VirtualDOM.createVirtualElement("li", null, "Effects of all actions and spells are now shown"), VirtualDOM.createVirtualElement("li", null, "Improved shop items descriptions"), VirtualDOM.createVirtualElement("li", null, "Fixed grammar mistakes"), VirtualDOM.createVirtualElement("li", null, "Fixed bug when some content was not visible under specific screen resolutions")), VirtualDOM.createVirtualElement("h4", null, "Version 0.0.2 (21.10.2022)"), VirtualDOM.createVirtualElement("ul", null, VirtualDOM.createVirtualElement("li", null, "Added new researches"), VirtualDOM.createVirtualElement("li", null, "Added battle mechanics"), VirtualDOM.createVirtualElement("li", null, "Added researcher banner"), VirtualDOM.createVirtualElement("li", null, "UI fixes"))), VirtualDOM.createVirtualElement("div", {
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
