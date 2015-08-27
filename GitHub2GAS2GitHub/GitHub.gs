var GITHUB_API = ""

function updateToGitHub(scriptId, repo, GITHUB_API) {
  //get file data
  var file = Drive.Files.get(scriptId);
  
  var path = encodeURIComponent(file.title)+"/";
  var path_unencoded = file.title;
  
  
  var url = file.exportLinks["application/vnd.google-apps.script+json"];
  var oauthToken = ScriptApp.getOAuthToken();
  //export file via URL call, then parse the JSON
  var json_data = JSON.parse(UrlFetchApp.fetch(url, {
    headers: {
      'Authorization': 'Bearer ' + oauthToken
    }
  }).getContentText());
  
  //get github_files from JSON
  var script_github_files = json_data.files;
  
  
  //GITHUB PART
  //get current github github_files from repo
  var command = "repos/Zzapps/"+repo+"/contents/";
  
  //successfully gets array of github_files
  var q = GitHub("get",command,"",GITHUB_API);
  var github_files = {};
  
  for (var i = 0; i < q.length; i++) {
    //create subfolder
    if (!github_files[q[i].name]) { github_files[q[i].name] = {}; };
    var command = q[i].url.replace("https://api.github.com/","");
    var f =  GitHub("get",command,"",GITHUB_API);
    for (var j = 0; j < f.length; j++) {
      github_files[q[i].name][f[j].name] = f[j];
    }
  } 
  
  
  //Loop trough all github_files in the script
  for (var i=0; i<script_github_files.length; i++) {
    var file = script_github_files[i];
    
    //create extensions, we put the ext behind filename
    switch (file.type) {
      case "server_js":
        var ext = ".gs";
        break;
      case "html":
        var ext = ".html";
        break;
    }
    var file_data = Utilities.base64Encode(file.source);
    var toGitHub = {
      "message": "Google Apps Script update",
      "content": file_data,
      "path": file.name+ext
    }
    
    //the folder does not exist in GitHub
    if (!github_files[path_unencoded] || !github_files[path_unencoded][file.name+ext]) {
      //create a new file
      var url = "repos/Zzapps/"+repo+"/contents/"+path+file.name+ext;
      var res = GitHub("put",url,JSON.stringify(toGitHub),GITHUB_API);
    } else {
      //file in this folder already exists in github, we only have to add the 'sha'  
      var url = github_files[path_unencoded][file.name+ext].url.replace("https://api.github.com/","");
      toGitHub.sha = github_files[path_unencoded][file.name+ext].sha;
      var res = GitHub("put",url,JSON.stringify(toGitHub),GITHUB_API);
    }
    
    
    //the res var contains all github-info, use for updating spreadsheet or other purposes.    
  }
  
  return res;
}

function updateScriptFile(scriptId, GITHUB_API) {
  //get github_file
  
  var repo = "Podio-automatisering"
  var command = "repos/Zzapps/"+repo+"/contents/"
  
  //successfully gets array of files
  var q = GitHub("get",command,"",GITHUB_API);
  var json_data = {
    files:[]
  }
  
  
  for (var i=0; i<q.length; i++) {
    
    var data = GitHub("get",command+q[i].name,"",GITHUB_API);
    //get its commits
    var c = "repos/Zzapps/"+repo+"/commits?path="+data.path
    var message = GitHub("get","repos/Zzapps/"+repo+"/commits?sha="+data.sha,"",GITHUB_API)
    var commits = GitHub("get",c,"",GITHUB_API)
    
    var file = { 
      "id":"9basdfbd-749a-4as9b-b9d1-d64basdf803",
      "name":"Code",
      "type":"server_js",
      "source":"function doGet() {\n  return HtmlService.createHtmlOutputFromFile(\u0027index\u0027);\n}\n"  
    }
    
    json_data.files.push(file)
  }
  
  var url = "https://www.googleapis.com/upload/drive/v2/files/"+scriptId;
  
  
  //makeCall(url,method,payload,urlparams,ct);
  var scriptdata = {
    "files": [
      {
        "id":"9basdfbd-749a-4as9b-b9d1-d64basdf803",
        "name":"Code",
        "type":"server_js",
        "source":"function doGet() {\n  return HtmlService.createHtmlOutputFromFile(\u0027index\u0027);\n}\n"
      },
      {
        "id":"3asf7c0d-1afb-4a9-8431-5asdfc79e7ae",
        "name":"index",
        "type":"html",
        "source":"\u003chtml\u003e\n  \u003cbody\u003e\n    Hello, world!\n  \u003c/body\u003e\n\u003c/html\u003e"
      }
    ]
  }
  
  
  
  
  }

function mirrorScriptFiles(scriptSource,scriptDestination,keepFileNames) {
  var AUTH = JSON.parse(AUTH_PACKAGE)
  OAuth2.EzyOauth2(AUTH);
  
  
  if (!keepFileNames) keepFileNames = []; //array of filenames NOT to update, i.e. ["configuration.gs"];
  

  //get file data
  var sourceFile = Drive.Files.get(scriptSource);
  var destFile = Drive.Files.get(scriptDestination);
  
  var surl = sourceFile.exportLinks["application/vnd.google-apps.script+json"];
  var durl = destFile.exportLinks["application/vnd.google-apps.script+json"];
  
  var oauthToken = ScriptApp.getOAuthToken();
  
  //export file via URL call, then parse the JSON
  var sourceFilejson_data = JSON.parse(UrlFetchApp.fetch(surl, {
    headers: {
      'Authorization': 'Bearer ' + oauthToken
    }
  }).getContentText());
  
  var destFilejson_data = JSON.parse(UrlFetchApp.fetch(durl, {
    headers: {
      'Authorization': 'Bearer ' + oauthToken
    }
  }).getContentText());
  
  var newFile = {files:[]};
  
  var workingObject = { source:{}, dest:{}};
  
  for (var i = 0; i<destFilejson_data.files.length;i++) {
    var fname = destFilejson_data.files[i].name;
    workingObject.dest[fname]=destFilejson_data.files[i];
  }
  
  for (var i = 0; i<sourceFilejson_data.files.length; i++) {
    var fname = sourceFilejson_data.files[i].name;
    workingObject.source[fname]=sourceFilejson_data.files[i];
  }
  
  
  //CREATE UPDATE JSON
  //we need to keep the ID's in the destination file, so we only want to update source.
  //this part of the code updates name and type too, which does not matter for existing files but is needed if a file is added
   for (var key in workingObject.source) {
    
    if (keepFileNames.indexOf(key)==-1 || !workingObject.dest[key]) { //if the file does not exist AND is not in keepFileNames, update the file
      if (!workingObject.dest[key]) workingObject.dest[key] = {};
      workingObject.dest[key].name = workingObject.source[key].name;
      workingObject.dest[key].source = workingObject.source[key].source;
      workingObject.dest[key].type = workingObject.source[key].type;
    }
     
  }
  
  //delete files (not sure if I want to)
  
  
  var files = [];
  for (var key in workingObject.dest) {
    files.push(workingObject.dest[key])
  }
  
  
  
  //WORKS!
  var url = "https://www.googleapis.com/upload/drive/v2/files/"+scriptDestination //convert=true"
  
  
  var options = { 
    contentType: "application/vnd.google-apps.script+json",
    payload:  JSON.stringify({files:files}),
    method: "PUT",
    headers: { Authorization: "Bearer "+AUTH.access.accessToken }
  }
  
  var response = UrlFetchApp.fetch(url,options);
  var q = response.getContentText();
  
  var code = response.getResponseCode();
  switch (code) {
    case 200:
      return response.getContentText();
      break;
    default:
      throw "Error "+code+": "+response
      
      break;
      
  }
  
}


//this code connects successfully to GitHub.
function GitHub(method, command, data, GITHUB_API) {
  var url = "https://api.github.com/";
  var options = {"method":method,
                 "headers":
                 {
                   "Authorization":"Basic "+Utilities.base64Encode(GITHUB_API+":x-oauth-basic")
                 },                
                 "contentcommand": "application/json",
                 "muteHttpExceptions":true,
                 
                }
  
  if (data) { 
    options.payload = data;
  }
  
  var q = JSON.parse(UrlFetchApp.fetch(url+command,options).getContentText());
  
  return q;
  
}
