/// <reference path="../typings/jquery.d.ts"/>
/// <reference path="../typings/jsrender.d.ts"/>
$(function() {
  var h = $(window).height();
  $('#wrap').css('display','none');
  $('#loader-bg ,#loader').height(h).css('display','block');
});

$(window).ready(function() {
  $('#loader-bg').delay(900).fadeOut(800);
  $('#loader').delay(600).fadeOut(300);
  $('#wrap').css('display','block');
});

$.ajaxSetup({
  beforeSend: function(xhr) {
    if (xhr.overrideMimeType) {
      xhr.overrideMimeType("application/json");
    }
  }
});

$(function() {
  setTimeout(function() {
    $('#wrap').css('display','block');
    $('#loader-bg').delay(900).fadeOut(800);
    $('#loader').delay(600).fadeOut(300);
    showSnackbar("このWEBサイトはCookieを使用します");
  }, 5000);

  function showSnackbar(message) {
    'use strict';
    document.querySelector('#snackbar').MaterialSnackbar.showSnackbar({
      message:message,
      timeout:2000
    });
  }

  function getURLParameter(param) {
    var URLVariables = window.location.search.substring(1).split('?');
    for (var i = 0; i < URLVariables.length; i++) {
      var paramName = URLVariables[i].split('=');
      if (paramName[0] == param) {
        paramName[1] = decodeURI(paramName[1]);
        return paramName[1];
      };
    };
  };

  function changeURLParameter(param,newParam) {
    if (!(getURLParameter(param) == newParam)) {
      var regex = new RegExp("[?]" + param + "[^?]*","g");
      if (newParam != "") {
        var parameter = '?' + param + '=' + newParam;
      } else {
        var parameter = "";
      }
      window.history.pushState('page',newParam,((window.location.href).replace(regex, "")) + parameter);
    };
  };

  function updateFavCount(legacy) {
    if (legacy == true) {
      var favCount = $.map(a,function(n,i) {
        return i;
      }).length;
    } else {
      var favCount = Object.keys(Cookies.get()).length;
    }
    $('.mdl-navigation__link:contains("お気に入り") > span').attr("data-badge",favCount);
  }

  function getCards(category,search) {
    $.getJSON('./data/cards.json').done(function(json) {
      var data = [];
      var renderList = [];
      
      if (search != "") { //search
        data = json;
        
        renderList = $.map(data,function(value,key) {
          var regex = new RegExp(search,"gi");
          var tabs = $.map(data[key].tabs || {},function(value,key) {
            return [value];
          });
          if ((((data[key].title || "")+(data[key].text || "")+(tabs.join(',') || "")+(data[key].orgName || "")+(data[key].orgId || "")).replace(/<("[^"]*"|'[^']*'|[^'">])*>/g,"").match(regex) || []).length > 0) {
            return key;
          } else {}
        });        
        //console.log("検索済みリスト",renderList);
      } else {
        data = $.each(json,function(value,key) {
          if (value.category == category) {
            return value;
          } else {}
        });
        
        /* if (id != "" && $.isArray(id) == true) { //id
          renderList = $.map(id,function(value,key) {
            return value;
          });
        } else*/ 
        if (category == "お気に入り") { //fav
          renderList = $.map(Cookies.get(),function(value,key) {
            if (value == "true") {
              return key.replace("card-","");
            } else {}
          });
          //console.log("お気に入り",renderList);
        } else {//full render
          renderList = $.map(data,function(value,key) {
            if (value.category == category) {
              return key;
            }
          });
        }
      }
      
      renderList.sort(naturalSort);
      //console.log("ソート済みリスト",renderList);
      
      $('.mdl-grid').fadeOut("fast",function() {
        $(this).empty();
        
        if (renderList.length == 0) { //no result
          //$('.mdl-grid').append($.render.cardTmpl(data)).hide().fadeIn("fast");
          $('.mdl-grid').css("display","");
          $('main').unhighlight();
          if (search != "") {
            $('.mdl-layout__header-row > .mdl-textfield').addClass('is-invalid');
          }
        } else {
          $.map(renderList,function(value,key) {
            var json = data[value];
            //console.log("json",json)
            $('.mdl-grid').append($.render.cardTmpl(json)).hide().fadeIn("fast");
            /*if (Cookies.get("card-" + json.id) == "true") {
              $('#card-' + json.id).find(".material-icons:contains('star')").text("star");
            } else {};*/
           
          });
          $('main .mdl-card__supporting-text,main .mdl-tabs__panel .mdl-card__supporting-text,main .mdl-card__title-text').highlight(search || "");
          $('.mdl-layout__header-row > .mdl-textfield').removeClass('is-invalid');
        }
        $('button:contains("star_border")').each(function() {
          if (Cookies.get($(this).parents('.mdl-card').attr("id")) == "true") {
            $(this).find('.material-icons').text("star");
          }
        });
        $('button').click(function() {
          if ($(this).find('.material-icons').text() == "star_border") {
            $(this).find('.material-icons').text("star");
            Cookies.set($(this).parents('.mdl-card').attr("id"),true,{
              expires: 365
            });
            updateFavCount(false);
            showSnackbar("お気に入りに追加しました");
          } else if ($(this).find('.material-icons').text() == "star") {
            $(this).find('.material-icons').text("star_border");
            var id = $(this).parents('.mdl-card').attr("id");
            Cookies.remove(id);
            if (category == "お気に入り") {
              $('#' + id).fadeOut("fast", function() {});
            }
            updateFavCount(false);
            showSnackbar("お気に入りから削除しました");
          }
        });
        $("a[href='#panel-0'],#panel-0").each(function() {
          $(this).addClass("is-active");
        });
        componentHandler.upgradeDom();
      });
    });
  }

  function renderUI(data) {
    $('.mdl-layout__header-row > .mdl-navigation').html($('#header').render(data));
    $('.mdl-layout__drawer > .mdl-navigation').html($('#drawer').render(data));
    $('.mdl-mini-footer__left-section > .mdl-mini-footer__link-list').html($('#footer').render(data));
    $('main').append($('#tooltip').render(data));
    $('<span class="mdl-badge">').appendTo('.mdl-navigation__link:contains("お気に入り")');
    updateFavCount(false);
  }

  function closeDrawer() {
    $('#mdl-drawer').removeClass('is-visible');
    $('.mdl-layout__obfuscator').removeClass('is-visible');
    $('#mdl-drawer').attr('aria-hidden','true');
  };

  var category = decodeURI(getURLParameter('c') || 'ホーム');
  var id = decodeURI(getURLParameter('n') || '');
  var query = decodeURI(getURLParameter('q') || '');
  $('#search').val(query);

  $.getJSON('./data/ui.json').done(function(data) {
    renderUI(data);
    $('.button').click(function() {
      closeDrawer();
      category = this.id;
      id = "";
      query = "";
      $('.mdl-layout__header-row > .mdl-textfield').removeClass('is-invalid is-focused is-dirty');
      $('#search').val("");
      $('#search').blur();
      getCards(this.id, query);
      changeURLParameter("c",this.id);
    });
  });
  
  $.templates("cardTmpl", {
    markup:"#card",
    allowCode:true
  });
  getCards(category,query);

  $('#search').change(function() {
    query = this.value;
    getCards(category, this.value);
    $('#search').blur();
    changeURLParameter("q",this.value);
  });

  //$("#page-title > h1, #page-title > h3, .mdl-card__title-text, .mdl-button, .mdl-layout__header-row > .mdl-layout-title, .mdl-layout__drawer > .mdl-layout-title,body").addClass('NotoSansJapanese');
  $('.layout-transparent').css("background","url('./images/8350.jpg') center / cover");

  $('#toPageTop').click(function() {
    $('main').animate({scrollTop: 0},'fast');
  });

  $('#drawer-close').click(function() {
    closeDrawer();
  });
  



      
})
