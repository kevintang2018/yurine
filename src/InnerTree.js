import homunculus from 'homunculus';
import csx from './csx';
import ignore from './ignore';
import linkage from './linkage';
import join2 from './join2';

let Token = homunculus.getClass('token', 'csx');
let Node = homunculus.getClass('node', 'csx');

class InnerTree {
  constructor(opt = {}, param = {}) {
    this.res = '';
    this.opt = opt;
    this.param = param;
  }

  parse(node) {
    this.recursion(node);
    return this.res;
  }
  recursion(node) {
    let self = this;
    let isToken = node.isToken();
    if(isToken) {
      let token = node.token();
      if(token.isVirtual()) {
        return;
      }
      if(!token.ignore) {
        this.res += token.content();
      }
      while(token.next()) {
        token = token.next();
        if(token.isVirtual() || !ignore.S.hasOwnProperty(token.type())) {
          break;
        }
        if(!token.ignore) {
          this.res += token.content();
        }
      }
    }
    else {
      switch(node.name()) {
        case Node.CSXElement:
        case Node.CSXSelfClosingElement:
          this.res += csx(node, {
            isInBind: self.opt.isInBind || self.opt.isBind,
            arrowFn: self.opt.arrowFn,
          }, self.param);
          return;
        case Node.RETSTMT:
          if(self.opt.isBind || self.opt.isInBind) {
            let allReturn = true;
            self.opt.arrowFn = self.opt.arrowFn || [];
            for(let i = 0, len = self.opt.arrowFn.length; i < len; i++) {
              if(!self.opt.arrowFn[i]) {
                allReturn = false;
                break;
              }
            }
            if(allReturn) {
              let temp = linkage(node.leaf(1), self.param, {
                arrowFn: self.opt.arrowFn,
              });
              let list = temp.arr;
              let listener = list.length === 1
                ? ('"' + list[0] + '"')
                : JSON.stringify(list);
              if(list.length) {
                return this.res += join2(node.first()) + 'new yurine.Obj('
                  + listener
                  + ',()=>{return('
                  + new InnerTree(self.opt, self.param).parse(node.leaf(1)).replace(/^(\s*){/, '$1').replace(/}(\s*)$/, '$1')
                  + ')})';
              }
            }
          }
          break;
        case Node.ARROWFN:
          self.opt.arrowFn = self.opt.arrowFn || [];
          if(self.opt.arrowFn.length === 0) {
            self.opt.arrowFn.push(true);
          }
          else {
            let is = false;
            let temp = node.parent();
            if(temp && temp.name() === Node.ARGLIST) {
              temp = temp.parent();
              if(temp && temp.name() === Node.ARGS) {
                let callexpr = temp.parent();
                temp = temp.prev();
                if(temp && temp.name() === Node.MMBEXPR) {
                  temp = temp.leaf(2);
                  if(temp.isToken() && temp.token().content() === 'map') {
                    is = callexpr.parent().name() === Node.RETSTMT;
                  }
                }
              }
            }
            self.opt.arrowFn.push(is);
          }
          break;
      }
      node.leaves().forEach(function(leaf) {
        self.recursion(leaf);
      });
      switch(node.name()) {
        case Node.ARROWFN:
          self.opt.arrowFn.pop();
          break;
      }
    }
  }
}

export default InnerTree;
