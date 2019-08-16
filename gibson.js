var VIEW_GIBSON = function() {
  var Gibson = function(options) {
    this.type = Gibson.type
    this.tab_name = this.type
    this.tab_id = `tab_${this.type}`
    this.navtab_id = `navtab_${this.type}`
    this.main_container_id = `wizard_${this.type}`
    this.index = modules.findIndex(m => m.type === this.type)
    this.params = Object.assign({}, params.views[this.index])
    this.lang = {}
    this.view = ''
    this.form = {}
    this.tsaID = ''
  }

  Gibson.prototype = new VIEW;

  Gibson.prototype.load = function(){
    return new Promise( (resolve, reject) => {
      this.getLang()
      .then( (lang) => {
        this.lang = i18n.create({ values: lang })
        return this.getView()
      })
      .then( (view) => {
        var _html = ejs.render(view, { hostname: params.hostname, name: this.type, lang: this.lang })
        if(!_html){
          throw new Error(`cannot render ${this.params.ejs}`)
        } else {
          this.tab_name = this.lang('name')
          document.getElementById(this.navtab_id).innerHTML = this.tab_name
          document.getElementById(this.main_container_id).innerHTML = _html

          this.form = {}
          this.form._willShowErrors = null

          document.getElementById("wizard_gibson_form_btn_sync").addEventListener('click', (e) => { this.onClickSync(e) });
          document.getElementById("cancel-btn").addEventListener('click', (e) => { this.onClickCancel(e) });
          resolve()
        }
      })
      .catch(err => {
        reject(err)
      })
    })
  }

  Gibson.prototype.isOk = function(){
     return true
  }

  Gibson.prototype.onClickSync = function(e){
      document.getElementById("pairing-loader").style.display = "block"
      document.getElementById("pairing-msg").style.display = "block"
      document.getElementById("cancel-btn").style.display = "block"
      let user = document.getElementById("zoib-login").value
      let request = new Request(`${this.params.api}/sync`);
      let pairingDate = new Date();

      request.setData({
          id: this.form.tsaId,
          name: this.form.tsaName,
          userOrGroupName: user
      })

      request.post().then((response) => {
          document.getElementById("pairing-loader").style.display = "none"
          document.getElementById("pairing-msg").style.display = "none"
          document.getElementById("cancel-btn").style.display = "none"
          this.getLang().then((lang) => {
              M.toast({html: lang.associationRegistered})
          })
      }).catch(console.error);
  }

  Gibson.prototype.onClickCancel = function(e){
      document.getElementById("pairing-loader").style.display = "none"
      document.getElementById("pairing-msg").style.display = "none"
      document.getElementById("cancel-btn").style.display = "none"
  }

  Gibson.prototype.getResumed = function(){
    var _html = ''
    if(this.form.ignore || !this.form.hostname || this.form.hostname === params.hostname){
      _html =  this.lang('resume_not_renamed', { device: params.device })
    } else {
      _html =  this.lang('resume_rename', { device: params.device, hostname: this.form.hostname })
    }
    return _html
  }

  Gibson.prototype.post = function(){
    if(!this.isOk()){
      return new Promise( (resolve, reject) => { resolve(true) })
    } else {
      var request = new Request(this.params.api)
      request.setData({

      })
      return request.post()
    }
  }

  Gibson.prototype.loaded = function(){
    let form = this.form = {}
    let requestID = new Request("/box_id")
    requestID.get().then(function(obj) {
        let elem = document.getElementById("tsa-id")
        elem.textContent = `${elem.textContent} ${obj.id}`
        form.tsaId = obj.id
    }).catch(console.error);

    let requestName = new Request("/box_name")
    requestName.get().then(function(obj) {
        let elem = document.getElementById("tsa-name")
        elem.textContent = `${elem.textContent} ${obj.boxname}`
        form.tsaName = obj.boxname
    }).catch(console.error);

    let userList = document.getElementById("associated-users")
    for(let i = 0; i < this.params.stats.users.length; i++) {
        let user = this.params.stats.users[i]
        userList.textContent = `${userList.textContent}, ${user}`
    }

    var _flagsRequest = new Request(this.params.api)
    return new Promise( (resolve, reject) => {
      _flagsRequest.get().then( flags => {
        try{
          flags = JSON.parse(flags)
        } catch(e){}
        this.checkButtonNextStats()
        resolve()
      })
    })
  }

  Gibson.prototype.ignored = function(){
    WIZARD.requestAlive.setUrl(WIZARD.aliveApi)
  }

  Gibson.prototype.unIgnored = function(){
    if(this.form.hostname !== '' && this.form.hostname !== params.hostname){
    } else {
      this.form.ignore = true
      WIZARD.requestAlive.setUrl(WIZARD.aliveApi)
    }
  }

  Gibson.type = 'gibson'

  return Gibson
}()

modules.push({type: VIEW_GIBSON.type, module: VIEW_GIBSON})
