$(function(e){
  e = e || window.event;
  // startX, startY 为鼠标点击时初始坐标
  // diffX, diffY 为鼠标初始坐标与 box 左上角坐标之差，用于拖动
  var startX, startY, diffX, diffY;
  // 是否拖动，初始为 false
  var dragging = false;
  var draw_obj = $('#img-item');
  // 鼠标按下
  document.onmousedown = function(e) {
      startX = e.pageX;
      startY = e.pageY;
      // 如果鼠标在 box 上被按下
      if(e.target.className.match(/box/)) {
          // 允许拖动
          dragging = true;
          // 设置当前 box 的 id 为 moving_box
          if(document.getElementById("moving_box") !== null) {
              document.getElementById("moving_box").removeAttribute("id");
          }
          e.target.id = "moving_box";
          // 计算坐标差值
          diffX = startX - e.target.offsetLeft;
          diffY = startY - e.target.offsetTop;
      }
      else if(e.target.className.indexOf("img-main")!=-1){// 如果鼠标在 样本区域 被按下
          // 在页面创建 box
          var active_box = document.createElement("div");
          active_box.id = "active_box";
          active_box.setAttribute("box_id",'box_'+boxId); // 设置
          boxId++;
          active_box.className = "box";
          active_box.style.position = 'absolute';
          active_box.style.top = startY + 'px';
          active_box.style.left = startX + 'px';
          document.body.appendChild(active_box);
          active_box = null;
      }
  };

  //右键移除该矩形框
  document.oncontextmenu = function(e){
    // 如果鼠标在 box 上按下右键
    if(e.target.className.match(/box/)) {
      document.body.removeChild(e.target);
      delete boxListOfSample[$(e.target).attr('box_id')];
      updateCurTagStatus();
      $('#cur_loc').html('');
      //不继续传递右键事件，即不弹出菜单
      return false;
    }
    return true;
  };

  // 鼠标移动
  document.onmousemove = function(e) {
      // 更新 box 尺寸
      if(document.getElementById("active_box") !== null) {
          var ab = document.getElementById("active_box");
          ab.style.width = e.pageX - startX + 'px';
          ab.style.height = e.pageY - startY + 'px';
      }
      // 移动，更新 box 坐标
      if(document.getElementById("moving_box") !== null && dragging) {
          var mb = document.getElementById("moving_box");
          mb.style.top = e.pageY - diffY + 'px';
          mb.style.left = e.pageX - diffX + 'px';
      }
  };

  // 鼠标抬起
  document.onmouseup = function(e) {
      // 禁止拖动
      dragging = false;
      if(document.getElementById("active_box") !== null) {
        var ab = document.getElementById("active_box");
        var curToothPosition = $('input[name="tooth"]:checked').val(); //牙位
        ab.removeAttribute("id");
          // 如果长宽均小于 3px，移除 box
        //   if(ab.offsetWidth < 3 || ab.offsetHeight < 3) {
        //       document.body.removeChild(ab);
        //   }else{
        updateLoc(ab);
        $(ab).html('<div class="box_label">'+"<font size=2>"+$('#ann input:checked').val()+"</font>"+"</div>"); //标签类别
        //   }
        if(curToothPosition==18){
          $('input[name="tooth"][value=17]').attr("checked", true);
        }
        else if(curToothPosition==17){
          $('input[name="tooth"][value=16]').attr("checked", true);
        }
        else if(curToothPosition==16){
          $('input[name="tooth"][value=15]').attr("checked", true);
        }
        else if(curToothPosition==15){
          $('input[name="tooth"][value=14]').attr("checked", true);
        }
        else if(curToothPosition==14){
          $('input[name="tooth"][value=13]').attr("checked", true);
        }
        else if(curToothPosition==13){
          $('input[name="tooth"][value=12]').attr("checked", true);
        }
        else if(curToothPosition==12){
          $('input[name="tooth"][value=11]').attr("checked", true);
        }
        else if(curToothPosition==11){
          $('input[name="tooth"][value=21]').attr("checked", true);
        }
        if(curToothPosition==21){
          $('input[name="tooth"][value=22]').attr("checked", true);
        }
        else if(curToothPosition==22){
          $('input[name="tooth"][value=23]').attr("checked", true);
        }
        else if(curToothPosition==23){
          $('input[name="tooth"][value=24]').attr("checked", true);
        }
        else if(curToothPosition==24){
          $('input[name="tooth"][value=25]').attr("checked", true);
        }
        else if(curToothPosition==25){
          $('input[name="tooth"][value=26]').attr("checked", true);
        }
        else if(curToothPosition==26){
          $('input[name="tooth"][value=27]').attr("checked", true);
        }
        else if(curToothPosition==27){
          $('input[name="tooth"][value=28]').attr("checked", true);
        }
        else if(curToothPosition==28){
          $('input[name="tooth"][value=48]').attr("checked", true);
        }
        if(curToothPosition==48){
          $('input[name="tooth"][value=47]').attr("checked", true);
        }
        else if(curToothPosition==47){
          $('input[name="tooth"][value=46]').attr("checked", true);
        }
        else if(curToothPosition==46){
          $('input[name="tooth"][value=45]').attr("checked", true);
        }
        else if(curToothPosition==45){
          $('input[name="tooth"][value=44]').attr("checked", true);
        }
        else if(curToothPosition==44){
          $('input[name="tooth"][value=43]').attr("checked", true);
        }
        else if(curToothPosition==43){
          $('input[name="tooth"][value=42]').attr("checked", true);
        }
        else if(curToothPosition==42){
          $('input[name="tooth"][value=41]').attr("checked", true);
        }
        else if(curToothPosition==41){
          $('input[name="tooth"][value=31]').attr("checked", true);
        }
        if(curToothPosition==31){
          $('input[name="tooth"][value=32]').attr("checked", true);
        }
        else if(curToothPosition==32){
          $('input[name="tooth"][value=33]').attr("checked", true);
        }
        else if(curToothPosition==33){
          $('input[name="tooth"][value=34]').attr("checked", true);
        }
        else if(curToothPosition==34){
          $('input[name="tooth"][value=35]').attr("checked", true);
        }
        else if(curToothPosition==35){
          $('input[name="tooth"][value=36]').attr("checked", true);
        }
        else if(curToothPosition==36){
          $('input[name="tooth"][value=37]').attr("checked", true);
        }
        else if(curToothPosition==37){
          $('input[name="tooth"][value=38]').attr("checked", true);
        }
        else if(curToothPosition==38){
          alert("所有牙齿都已经标记了！")
        }
      }else if(document.getElementById("moving_box") !== null) {
        var ab = document.getElementById("moving_box");
        updateLoc(ab);
      }
  };

  function updateLoc(obj){
    img = document.getElementById("img-item");
    x_left = obj.offsetLeft - img.offsetLeft;
    y_left = obj.offsetTop - img.offsetTop;
    x_right = x_left + $(obj).width();
    y_right = y_left + $(obj).height();
    var regionLoc = x_left+','+y_left+','+x_right+','+y_right; //2个坐标
    $('#cur_loc').html(regionLoc);
    var picId = $('#cur_id').html(); //照片id
    var regionClass = $('#ann input:checked').val(); //标签类别
    var toothPosition = $('input[name="tooth"]:checked').val(); //牙位
    tagStr = picId+','+regionLoc+","+regionClass+","+toothPosition;
    box_id = $(obj).attr('box_id');
    boxListOfSample[box_id] = tagStr;
    updateCurTagStatus();
  }
});

// c初始化当前图片的status列表
function initCurTagStatus(){
    tagStrTotal = '';
    var textarea = $('#annotation_cur_status').val(tagStrTotal);
    textarea.scrollTop(textarea[0].scrollHeight - textarea.height());
}

// 当前图片的status列表
function updateCurTagStatus(){
    tagStrTotal = '';
    for(key in boxListOfSample){
        tagStrTotal+=boxListOfSample[key]+'\n';
    }
    var textarea = $('#annotation_cur_status').val(tagStrTotal);
    textarea.scrollTop(textarea[0].scrollHeight - textarea.height());
}

// 累加CurTagStatus列表
function updateTotalTagStatus(){
    tagStrTotal = '';
    for(key in boxListOfSample){
        tagStrTotal+=boxListOfSample[key]+'\n';
    }
    var textarea = $('#annotation_total_status').append(tagStrTotal);
    textarea.scrollTop(textarea[0].scrollHeight - textarea.height());
}