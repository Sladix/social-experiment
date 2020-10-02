var progressCache = {};
const achievments = [
  {
    icon : 'plug',
    description : 'Just connected to the shit',
    check : function(){
      return true;
    },
    xp : 5
  }
  ,
  {
    icon : 'hand-paper-o',
    description : 'Said Hello !',
    check : function(box){
      let msg = box.text;
      return checkHello(msg);
    },
    xp : 10
  },
  {
    icon : 'hand-paper-o fa-2x',
    description : 'Said Hello 5x times',
    check : function(box){
      let p = getCache(box);
      let h = checkHello(box.text);
      if(h){
        if(!p.sh){
          p.sh = [];
        }
        if(p.sh.indexOf(h) === -1){
          p.sh.push(h);
        }
        if(p.sh.length == 5){
          return true;
        }
      }
    },
    xp : 50
  },
  {
    icon : 'commenting-o',
    description : 'Knows about hyperchat',
    check : function(box){
      var re = /(\W|^)hyperchat(\W|$)/gi;
      if(box.text.match(re)){
        return true;
      }
    },
    xp : 15
  },
  {
    icon: 'lock',
    description : 'Has admin powers',
    check : function(box){
      return box.admin;
    },
    xp : 0
  },
  {
    icon: 'id-card-o',
    description : 'Knows about the French Dude',
    check : function(box){
      var re = /(\W|^)french\sdude(\W|$)/gi;
      if(box.text.match(re)){
        return true;
      }
    },
    xp : 20
  },
  {
    icon : 'line-chart',
    description : 'Went to the chars limit',
    check : function(box){
      return box.text.length == 150
    },
    xp : 10
  },
  {
    icon : 'clock-o',
    description : 'Stayed more than 5mn',
    check : function(box){
      let p = getCache(box);
      if(!p.firstMessage){
        p.firstMessage = new Date();
      }
      if(Math.abs(((new Date()).getTime() - p.firstMessage.getTime()) / 1000) >= 3500){
        return true;
      }
    },
    xp : 30
  },
  {
    icon : 'clock-o fa-2x',
    description : 'Stayed more than 10mn',
    check : function(box){
      let p = getCache(box);
      if(!p.firstMessage){
        p.firstMessage = new Date();
      }
      if(Math.abs(((new Date()).getTime() - p.firstMessage.getTime()) / 1000) >= 7000){
        return true;
      }
    },
    xp : 70
  },
  {
    icon : 'coffee',
    description : 'Likes coffee',
    check : function(box){
      var re = /(\W|^)i\s(like|love)\scoffee(\W|$)/gi;
      if(box.text.match(re)){
        return true;
      }
    },
    xp : 10
  },
  {
    icon : 'beer',
    description : 'Likes beer',
    check : function(box){
      var re = /(\W|^)i\s(like|love)\sbeer(\W|$)/gi;
      if(box.text.match(re)){
        return true;
      }
    },
    xp : 10
  },
  {
    icon : 'question',
    description : 'Was confused',
    check : function(box){
      var re = /(\W|^)wtf|What\sthe\s(hell|fuck)(\W|$)/gi;
      if(box.text.match(re)){
        return true;
      }
    },
    xp : 10
  },
  {
    icon : 'bolt',
    description : 'Run Barry, run !',
    check : function(box){
      var re = /(\W|^)flash(\W|$)/gi;
      if(box.text.match(re)){
        return true;
      }
    },
    xp : 20
  },
  {
    icon : 'smile-o',
    description : 'Had a good laugh',
    check : function(box){
      var re = /(\W|^)(hah).|(aha).|(lol|mdr|rofl)(\W|$)/gi;
      if(box.text.match(re)){
        return true;
      }
    },
    xp : 10
  },
  {
    icon : 'sign-out',
    description : 'Said bye to someone',
    check : function(box){
      var re = /(\W|^)bye|cya|see\syou(\W|$)/gi;
      if(box.text.match(re)){
        return true;
      }
    },
    xp : 10
  },
  {
    icon : 'bed',
    description : 'Was tired',
    check : function(box){
      var re = /(\W|^)sleep(\W|$)/gi;
      if(box.text.match(re)){
        return true;
      }
    },
    xp : 10
  },
  {
    icon : 'legal',
    description : 'Attacked someone',
    check : function(box){
      var p = getCache(box);
      if(p.attack){
        return true;
      }
    },
    xp : 15
  },
  {
    icon : 'heart',
    description : 'Healed someone',
    check : function(box){
      var p = getCache(box);
      if(p.heal){
        return true;
      }
    },
    xp : 15
  },
  {
    icon : 'thumbs-down',
    description : 'Killed someone',
    check : function(box){
      var p = getCache(box);
      if(p.victims){
        return true;
      }
    },
    xp : 30
  },
  {
    icon : 'close',
    description : 'Dick lover',
    check : function(box){
      var re = /(\W|^)8(\=)*D(\W|$)/gi;
      if(box.text.match(re)){
        return true;
      }
    },
    xp : 10
  }
];

function checkHello(msg){
  var hellos = ['Hey','Hello','Hi','Yo(o)*','Greetings','Salutations','Salut','Welcome','Howdies'];
  let found = false;
    hellos.forEach((h) => {
        if(found){
          return;
        }
       let re = new RegExp("(\\W|^)"+h+"(\\W)","gi");
       if(msg.match(re)){
         found = h;
       }
   });
   return found;
}

function update(box,key,value = 1){
  let p = getCache(box);
  if(!p[key]){
    p[key] = 0;
  }
  p[key] += value;
}
function cleanCache(box){
  let p = getCache(box);
  delete p[box.id];
}
function getCache(box){
  if(!progressCache[box.id]){
    progressCache[box.id] = {};
  }
  return progressCache[box.id];
}

function checkAndSetAchievments(box){
  let updated = [];
  let xp = 0;
  achievments.forEach((a) => {
    if(!box.achievments.find((ac)=>{return ac.icon == a.icon}) && a.check(box)){
      updated.push({
        icon : a.icon,
        description : a.description
      });
      xp += a.xp;
    }
  });
  return {
    updated : updated,
    xp : xp
  }
};

exports.achievments = checkAndSetAchievments;
exports.achievementsCount = achievments.length - 1;
exports.cleanCache = cleanCache;
exports.update = update;