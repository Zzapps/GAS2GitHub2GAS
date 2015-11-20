//add something
var AUTH_PACKAGE = PropertiesService.getScriptProperties().getProperty("oauth");

function initialStore () {
  setAuthenticationPackage ( {
   clientId : "",
   clientSecret : "",
   scopes : ['https://www.googleapis.com/auth/drive.file','https://www.googleapis.com/auth/drive.scripts','https://www.googleapis.com/auth/drive']
  } , "oauth" );
}

function doGet (e) {
  
  // set up authentication
  var eo = new OAuth2.oauth (getAuthenticationPackage_(), "getAccessTokenCallback");
  
  // eo will have checked for an unexpired access code, or got a new one with a refresh code if it was possible, and we'll already have it
  if (eo.isOk()) {
    
    // should save the updated properties for next time
    setAuthenticationPackage("oauth", getAuthenticationPackage_());
    
    // good to do whatever we're here to do
    //return doGet_ (e);
  }  
  else {
    // start off the oauth2 dance - you'll want to pretty this up probably
      return HtmlService.createHtmlOutput ( '<a href = "' + eo.getUserConsentUrl() + '">Authenticate first to the application</a> ');
  }
}

function doPost (e) {
  // set up authentication
 return doPost_ (e);

}

/* 
 * patterns you can reuse for writing apps needing oAuth2
 * just copy the whole thing to your project 
 * for first time running seee oneTimeSet to load your credentials to your property store
 * you shouldn't need to modify any of this
 */


/**
 * gets the property key against which the authentication package will be stored
 * @param {string} optPackageName
 * @return {object} authentication package
 */
function getAuthenticationPackage_ (optPackageName) {
   if (!AUTH_PACKAGE) throw "Authorisatie niet geconfigureerd!";
  try {
    var PARSED_AUTH_PACKAGE = JSON.parse(AUTH_PACKAGE);
    return PARSED_AUTH_PACKAGE;
  } catch (err) {
    throw "Authorisatiepakket ongeldig!"
  }
}

/**
 * set your authentication package back to your property service
 * this will make the access token and refresh token available next time it runs 
 * @param {object} authentication package to set
 * @return {void}
 */
function setAuthenticationPackage_ (package) {
  PropertiesService.getScriptProperties().setProperty("oauth", JSON.stringify(package));
}

/** 
 * this will be the first call back, you now need to get the access token
 * @param {object} e arguments as setup by the statetokenbuilder
 * @param {function} theWork that will be called with the access token as an argumment
 * @return {*} the result of the call to func()
 */
function getAccessTokenCallback(e) {

  // this will fetch the access token
  var authenticationPackage = getAuthenticationPackage_ (e.parameter.package_name);
  var eo = new OAuth2.oauth(authenticationPackage).fetchAccessToken(e);
  
  if (!eo.isOk()) {
    throw ('failed to get access token:'+eo.getAccessTokenResult().getContentText());
  }
  else {
    // should save the updated properties for next time
    setAuthenticationPackage_ (authenticationPackage);
    return e.parameter.work ? evalWork(e.parameter.work) : null;
  }
      
  function evalWork (func) {
    return eval (func +'("' +eo.getAccessToken() +'")');
  }
}

/**
 * gets called by doGet
 * @param {object} the doGet() parameters
 * @param {function} consentScreen - will be called with the consent Url as a an argument if required
 * @param {function} doSomething - the function that actually does your work
 * @param {function} optPackageName - optional package name to identify the oauth2 package to use
 * @return {*} whatever doSomething returns
 */ 
function doGetPattern(e, consentScreen, theWork,optPackageName) {
  // set up authentication
  var packageName = optPackageName || '';
  var authenticationPackage = getAuthenticationPackage_ (packageName);
  if (!authenticationPackage) {
    throw "You need to set up your credentials one time";
  }

  var eo = new OAuth2.oauth ( authenticationPackage, "getAccessTokenCallback", undefined, {work:theWork.name,package_name:packageName} );
  
  // eo will have checked for an unexpired access code, or got a new one with a refresh code if it was possible, and we'll already have it
  if (eo.isOk()) {
    // should save the updated properties for next time
    setAuthenticationPackage_ (authenticationPackage);
    // good to do whatever we're here to do
    return theWork (eo.getAccessToken());
  }
  
  else {

    // start off the oauth2 dance - you'll want to pretty this up probably
      return HtmlService.createHtmlOutput ( consentScreen(eo.getUserConsentUrl()) );
  }
}


