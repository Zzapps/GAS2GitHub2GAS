var GITHUB_API = ""

//i.e.:
//https://github.com/{{company}}/{{repo}}/
//https://github.com/Zzapps/GAS2GitHub2GAS/
function updateToGitHub(scriptId, repo, company, GITHUB_API) {
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
  var command = "repos/"+company+"/"+repo+"/contents/";
  
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
      var url = "repos/"+company+"/"+repo+"/contents/"+path+file.name+ext;
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
