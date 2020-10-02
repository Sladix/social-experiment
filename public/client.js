// client-side js
// run by the browser each time your view template is loaded

// by default, you've got jQuery,
// add other scripts at the bottom of index.html
(function(){
  var socket = io();
  
  Vue.component('achievment', {
    props: ['achievment'],
    template: '<span class="achievment"><i :class="achievment.icon"></i><span class="description">{{achievment.description}}</span></span>'
  });
  
  Vue.component('powerbar', {
    props: ['box'],
    template: `<div class="power-bar" v-if="!box.admin">
      <button @click="mute" class="btn btn-xs btn-danger" :data-id="box.id">Mute</button>
    </div>`,
    methods : {
      mute : function(event){
        socket.emit('command','mute '+event.target.dataset.id)
      }
    }
  });
  
  Vue.component('actionbar',{
    props: ['box'],
    template: `<div class="action-bar" v-if="canAct">
      <button @click="attack" class="btn btn-xs btn-danger"><i class="fa fa-legal"></i>Attack</button>
      <button @click="heal" class="btn btn-xs btn-success"><i class="fa fa-medkit"></i>Heal</button>
    </div>`,
    methods : {
      attack : function(event){
        socket.emit('command','attack '+this.box.id)
      },
      heal : function(event){
        socket.emit('command','heal '+this.box.id)
      }
    },
    computed : {
      canAct : function(){
        const cb = app.boxes.find((bb) => {return bb.id === socket.id});
        return Math.floor(computeLevel(cb.xp)) > 1 && Math.floor(computeLevel(cb.xp)) <= Math.floor(computeLevel(this.box.xp))  && this.box.id != cb.id;
      }
    }
  });

  Vue.component('box-item', {
    props: ['box'],
    template: `<div :class="[box.admin,box.alive]" class="box panel panel-default">
      <div class="panel-header">
          <div class="row zgeg">
            <div class="c">
              <div class="progress">
                <div class="progress-bar  progress-bar-success" role="progressbar"  aria-valuemin="0" aria-valuemax="100" :style="{ width: percentage+'%', background: box.color }">
                  {{percentage}}%
                </div>
              </div>
            </div>
            <div class="c">
                <span class="label label-default" :style="{background:box.color}">lvl.{{ level }}</span>
            </div>
          </div>
          <div class="row zgeg">
            <div class="c">
            <div class="progress">
              <div class="progress-bar  progress-bar-danger" role="progressbar"  aria-valuemin="0" aria-valuemax="100" :style="{ width: box.life+'%'}">
                {{box.life}}%
              </div>
            </div>
            </div>
            
            <div class="c">
                <span class="label label-danger"><i class="fa fa-heartbeat"></i></span>
            </div>
          </div>
      </div>
      <div class="panel-body">{{ box.text }}</div>
      <div class="achievments">
        <achievment v-for="achievment in box.achievments" v-bind:achievment="achievment"></achievment>
      </div>
      <powerbar v-if="hasPowers" v-bind:box="box"></powerbar>
      <actionbar v-bind:box="box"></actionbar>
      <div class="panel-footer">Here since {{box.joined}}</div>
  </div>`,
  computed : {
    hasPowers : function(){
      const cb = app.boxes.find((bb) => {return bb.id === socket.id});
      return cb.admin || cb.modo;
    },
    level : function(){
      return Math.floor(computeLevel(this.box.xp));
    },
    percentage : function(){
      var nl = Math.floor(computeLevel(this.box.xp));
      return Math.round(this.box.xp / getXpNeededForLevel(++nl) * 100);
    }
  }
  });
  
  var app = new Vue({
    el: '#app',
    data: {
      userInput: '',
      canTalk:true,
      boxes:[],
      userCount:0,
      limit:0,
      achievementsCount:0,
      showCommandBar:false,
      userCommand:'',
      darkmode : false,
      liked : false
    },
    methods:{
      sendMessage : function(event){
        if(event.target.value.length <= this.limit)
          socket.emit('updateMessage',this.userInput);
        else
          event.target.value = event.target.value.substring(0,this.limit);
      },
      sendCommand : function(event){
        if(this.userCommand.length < 1){
          return;
        }
        else{
          socket.emit('command',this.userCommand);
        }
        this.userCommand = '';
      },
      toggleMode : function(event){
        this.darkmode = !this.darkmode;
        let b = document.getElementsByTagName('body')[0];
        b.classList.toggle('dark');
        b.classList.toggle('light');
      },
      iLikeThis: function(event){
        ga('send', 'event', 'Button', 'click', 'I like This');
        displayUnlocks([{icon:'fa fa-heart',description:'Thank you for showing some love',alert:true}]);
        this.liked = true;
      }
    },
    computed:{
      charsLeft : function(){
        return this.limit - this.userInput.length
      }
    }
  });
  
  
  function viewModelForBox(box){
    let date = moment(box.joined);
    return {
      text : box.text,
      id : box.id,
      joined : date.format("DD/MM H:mm:ss"),
      admin : box.admin ? 'is-admin' : '',
      canTalk : box.alive,
      achievments : box.achievments.map((a)=> { a.icon = "fa fa-"+a.icon; return a }),
      xp : box.xp,
      color : box.color,
      life : box.life,
      alive : (box.alive)?'':'dead'
    };
  }
  
  var threshold = 20;
  
  function computeLevel(xp){
    return (1 + Math.sqrt(1+8*xp/threshold))/2;
  }
  
  function getXpNeededForLevel(nl){
    return 0.5*(Math.pow(nl,2)-nl)*threshold;
  }
  
  // Socket listeners
  socket.on('grabBoxes',function(data){
    document.getElementById('app').classList.remove('hidden');
    app.boxes = data.boxes.map(viewModelForBox);
    app.userCount = app.boxes.length;
    app.limit = data.limit;
    app.achievementsCount = data.achievementsCount;
    console.log('box grabbed');
  });
  
  socket.on('updateUsercount',function(data){
    app.userCount = data;
  });
  
  socket.on('addBox',function(b){
    app.boxes.push(viewModelForBox(b));
    console.log('box added');
  });
  
  socket.on('unlockAchievment',function(acs){
    let me = app.boxes.find((bb) => {return bb.id === socket.id});
    let formatted = acs.map((a)=> { a.icon = "fa fa-"+a.icon; return a });
    me.achievments = [...me.achievments,...formatted];
    // TODO message from top
    displayUnlocks(formatted);
  });
  
  socket.on('updateBox',function(b){
    let ref = app.boxes.find((bb) => {return bb.id === b.id});
    let index = app.boxes.indexOf(ref);
    Vue.set(app.boxes, index, viewModelForBox(b));
  });
  
  socket.on('removeBox',function(id){
    app.boxes = app.boxes.filter((b)=>{return b.id !== id});
  });
  
  socket.on('muted',function(){
    app.canTalk = false;
    displayUnlocks([{icon:'fa fa-close',description:'You Have been muted',alert:true}]);
  });
  
  socket.on('anounce',function(msg){
    displayUnlocks([{icon:'fa fa-bullhorn',description:msg,alert:true}]);
  })
  
  function displayUnlocks(arr){
    var unlocks = document.getElementById('unlocks');
    arr.forEach((a)=>{
      var el = document.createElement('div');
      el.classList.add('unlock');
      if(a.alert){
        el.innerHTML = '<p><i class="'+a.icon+'"></i> '+a.description+' <span class="al">x</span></p>';
      }else{
        el.innerHTML = '<p><b>Badge Unlocked : </b> <i class="'+a.icon+'"></i> '+a.description+' <span class="al">x</span></p>';
      }
      unlocks.appendChild(el);
      var to = setTimeout(function(){
        el.parentElement.removeChild(el);
      },10000);
      el.addEventListener('click',function(e){
        el.parentElement.removeChild(el);
        clearTimeout(to);
      });
    });
  }
  
  function toggleCommandBar(){
    app.showCommandBar = !app.showCommandBar;
  }
  
  cheet('t o o l b a r', function () {
    let i = document.getElementById('ta');
    if(i !== document.activeElement)
      toggleCommandBar();
  });
  
})()