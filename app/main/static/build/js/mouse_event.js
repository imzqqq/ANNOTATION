/**
 * 业务相关的JS处理代码
 */

const preview = document.querySelector('.preview');
var canvas_item = document.getElementById('canvas')
context = canvas_item.getContext("2d")
var startx,//起始x坐标
    starty,//起始y坐标
    mousedown,//是否点击鼠标的标志
    current_x,
    current_y,
    allNotIn = 0;

var annotation_box=[];//图层
var scale = 1

var box_color="#00ff00"
var label_color = "#ff0000";

var clickedArea = {
  box: -1,
  pos: 'o'
};

var rightclickedArea = {
  box: -1,
  pos: 'o'
};

// var moveArea = {
//   box: -1,
//   pos: 'o'
// };

var tmpBox = null

var x1 = -1;
var y1 = -1;
var x2 = -1;
var y2 = -1;

var border_size = 2;

var image_naturalWidth, image_naturalHeight

var ctrl_key

function updateImageDisplay(obj){
    //更新牙位状态
    ctrl_key = 0
    initToothStatus();
    annotation_box = []
    scale = 1;
    allNotIn = 0;
    mousedown = 0;
    initPage(obj);
    get_labels();
    // console.log('----------',image_naturalWidth,image_naturalHeight)
    reloadAnnotationBox();
     // initPage(obj);
}

function reloadAnnotationBox(){
    var parent_btn = document.querySelector('.reload')
    while (parent_btn.firstChild) {
        parent_btn.removeChild(parent_btn.firstChild);
     }
    reload_btn = document.createElement('button')
    reload_btn.id = "thumbnail-reload-btn"
    reload_btn.type = "button"
    reload_btn.className="btn-info"
    reload_btn.innerText = "载入已标注数据"
    parent_btn.appendChild(reload_btn)

    $('#thumbnail-reload-btn').click(function (){
        user = document.getElementsByClassName("avatar");
        user_name =  user[0].alt;
        $.ajax({
            type: "POST",
            dataType: "json",
            url: "/api/annotation/reload?" + new Date(),
            data: { 'user': user_name, 'pic_name' : picNameStr},
            beforeSend: function() {},
            success: function(result) {
                layer.msg(result.msg);
                if(result.code === 1){
                     // 恢复拍片日期
                    $('#shootingDate').val(result.shoot_date);
                    var getDataArray = result.annotation_box
                    annotation_box = JSON.parse(getDataArray)
                    // console.log(annotation_box)
                    computereloadbox();
                    reloadtoothstatus();
                    allNotIn++;
                    drawonbox();
                }
                // console.log(result.tooth_list)
                //draw(result.coordinate_list, result.tooth_list, result.class_list, obj.img_resolution_w , obj.img_resolution_h);
            },
            error: function() {}
        });
    });
}

$('#annotation-type').click(function() {
    var regionClass = $('#ann input:checked').val();
    var toothPosition = $('input[name="tooth"]:checked').val();
    var tooth_status = document.getElementsByName(toothPosition)[0]
    if(tooth_status.style.background === 'green'){
        updateRegionClass(regionClass,toothPosition);
    }
    context.clearRect(0,0,canvas_item.width,canvas_item.height)
    drawpicture();
    drawonbox();
    // $(document).focus();
});



function updateRegionClass(regionClass,toothPosition){
    annotation_box.forEach(item=>{
        if(item.toothPosition === toothPosition){
            if(item.regionClass !== regionClass){
                item.regionClass = regionClass;
                layer.msg('牙评分更新成功')
                return ;
            }
        }
    })

}

function initPage(obj){
    loadSamplePic(obj);
    $('#btn_save').click(function() {
        if(JSON.stringify(annotation_box) == '[]'){
            layer.msg('还未标注任何数据！')
            return ;
        }
        picNameStr = $('#cur_id').html();
        if(confirm('您确定要保存  <'+picNameStr+'>  的标注信息吗？')) {
            shootdate = document.querySelector('input[type="date"]').value;
            user = document.getElementsByClassName("avatar");
            user_name =  user[0].alt;
            var time = new Date();
            day = ("0" + time.getDate()).slice(-2);
            month = ("0" + (time.getMonth() + 1)).slice(-2);
            var today = time.getFullYear() + "-" + (month) + "-" + (day);
            //console.log(annotation_box,user_name,picNameStr,shootdate,today)
            saveRegionInfo(annotation_box,user_name,picNameStr,shootdate,today);
        }
    });
}

function containImg(box_w,box_h,source_w,source_h){
    var ratio = 1;
    var ratio_base_on_w = box_w/source_w;
    var ratio_base_on_h = box_h/source_h;

    // case 1
    var real_size_1_w = source_w * ratio_base_on_w;
    var real_size_1_h = source_h * ratio_base_on_w;

    // case 2
    var real_size_2_w = source_w * ratio_base_on_h;
    var real_size_2_h = source_h * ratio_base_on_h;
    // console.log('----', real_size_1_h, real_size_2_w)
    if(real_size_1_h<=box_h){
        ratio = ratio_base_on_w;
    }
    else if (real_size_2_w<=box_w){
        ratio = ratio_base_on_h;
    }
    return ratio
}

function writePreview(obj){
    while(preview.firstChild){
        preview.removeChild(preview.firstChild)
    }

    const list = document.createElement('ol');
     preview.appendChild(list);
     const listItem = document.createElement('li');
     const para_name = document.createElement('p');
     const image = document.createElement('img');
     //通过调用URL.createObjectURL(curFiles[i])来生成图片的一张缩略预览图
     image.src = obj.img_url
     image.alt = obj.img_name

     para_name.textContent = '文件名:  ' + image.alt + '---------文件大小:  ' + obj.img_size + '---------分辨率:  ' + '(' + image_naturalWidth + ', ' + image_naturalHeight + ')';
     listItem.appendChild(image);
     listItem.appendChild(para_name);
     list.appendChild(listItem);

}

function loadSamplePic(obj) {
    //加载图片
    img_url = obj.img_url;
    picNameStr = obj.img_name;

    var new_img = document.getElementById('source')
    new_img.src = img_url
    var context = document.getElementById("canvas").getContext('2d');


    var canvas_item = document.getElementById('canvas')
    new_img.onload = function () {
        img = document.getElementById("img-item");
        canvas_item.setAttribute('width', img.clientWidth)
        canvas_item.setAttribute('height', img.clientHeight)

        image_naturalWidth = new_img.naturalWidth
        image_naturalHeight = new_img.naturalHeight
        // console.log(image_naturalWidth,image_naturalHeight)
        // console.log(canvas_item.width)
        // console.log(canvas_item.height)
        scale = 1
        scale = containImg(canvas_item.width, canvas_item.height, image_naturalWidth, image_naturalHeight)
        realwidth = scale * image_naturalWidth
        realheight = scale * image_naturalHeight
        context.clearRect(0, 0, canvas_item.width, canvas_item.height)
        context.drawImage(new_img, 0, 0, image_naturalWidth, image_naturalHeight, 0, 0, realwidth, realheight)
        writePreview(obj)
    }

    // 当前文件，当前坐标区域，拍片日期
    //当前文件
    $('#cur_id').html(picNameStr);
    $('.box').remove();
    //当前坐标区域
    $('#cur_loc').html('');
    var year, month, day;
    //针对文件中有拍片日期的情况
    if (picNameStr.indexOf("-") !== -1) {
        var thedate = picNameStr.split("-");
        var pre_shootdate = thedate[1].slice(0, 8);
        year = pre_shootdate.slice(0, 4);
        month = pre_shootdate.slice(4, 6);
        day = pre_shootdate.slice(6, 8);
        var shootdate = (year) + "-" + (month) + "-" + (day);
        $('#shootingDate').val(shootdate);
        $('#datetips').val('已从文件名中读取拍片日期');
    } else {
        var time = new Date();
        day = ("0" + time.getDate()).slice(-2);
        month = ("0" + (time.getMonth() + 1)).slice(-2);
        var today = time.getFullYear() + "-" + (month) + "-" + (day);
        $('#shootingDate').val(today);
        $('#datetips').val('请手动设置拍片日期');
    }
}

function saveRegionInfo(annotation_box,user_name,picNameStr,shootdate,today) {
    annotation_box_json = JSON.stringify(annotation_box)
    if(annotation_box_json == '{}'){
        alert('没有标注信息！')
        return
    }
    // console.log(annotation_box_json)
    $.ajax({
        type: "POST",
        dataType: "json",
        url: "/api/annotation/save?" + new Date(),
        data: { 'ann_info':annotation_box_json, 'user': user_name, 'pic_name' : picNameStr, 'shoot_date':shootdate, 'ann_date':today},
        beforeSend: function() {},
        success: function(result) {
            layer.msg(result.message);
        },
        error: function() {}
    });
}


function drawpicture(){
    var new_img = document.getElementById('source')
    var image_width = new_img.naturalWidth
    var image_height = new_img.naturalHeight
    // ratio = containImg(canvas_item.width, canvas_item.height, image_width, image_height)
    realwidth = scale * image_width
    realheight = scale * image_height
    context.clearRect(0, 0, canvas_item.width, canvas_item.height)
    context.drawImage(new_img, 0, 0, image_width, image_height, 0, 0, realwidth, realheight)
}

var lineOffset = 4;
function findCurrentArea(x,y){
    //console.log('---=====',x,y)
    //console.log(layers)
    tmp_lineOffset = lineOffset * 2;
    for (var item = 0; item < annotation_box.length; item++){
         if (annotation_box[item].x1 - tmp_lineOffset < x && x < annotation_box[item].x1 + tmp_lineOffset) {
             if (annotation_box[item].y1 - tmp_lineOffset < y && y < annotation_box [item].y1 + tmp_lineOffset) {
                 return {
                     box: annotation_box[item].index,
                     pos: 'nw'
                 };
             }
             else if (annotation_box[item].y2 - tmp_lineOffset < y && y < annotation_box[item].y2 + tmp_lineOffset) {
                 return {
                     box: annotation_box[item].index,
                     pos: 'sw'
                 };
             }
             else if (annotation_box[item].y1 + tmp_lineOffset < y && y < annotation_box[item].y2 - tmp_lineOffset) {
                 return {
                     box: annotation_box[item].index,
                     pos: 'w'
                 };
             }
         }
         else if(annotation_box[item].x2 - tmp_lineOffset < x && x < annotation_box[item].x2 + tmp_lineOffset){
             if (annotation_box[item].y1 - tmp_lineOffset < y && y < annotation_box[item].y1 + tmp_lineOffset) {
                 return {
                     box: annotation_box[item].index,
                     pos: 'ne'
                 };
             }
             else if (annotation_box[item].y2 - tmp_lineOffset < y && y < annotation_box[item].y2 + tmp_lineOffset) {
                 return {
                     box: annotation_box[item].index,
                     pos: 'se'
                 };
             }
             else if (annotation_box[item].y1 + tmp_lineOffset < y && y < annotation_box[item].y2 - tmp_lineOffset) {
                 return {
                     box: annotation_box[item].index,
                     pos: 'e'
                 };
             }

         }
         else if (annotation_box[item].x1 + tmp_lineOffset < x && x < annotation_box[item].x2 - tmp_lineOffset) {
             if (annotation_box[item].y1 - tmp_lineOffset < y && y < annotation_box[item].y1 + tmp_lineOffset) {
                 return {
                     box: annotation_box[item].index,
                     pos: 'n'
                 };
             }
             else if (annotation_box[item].y2 - tmp_lineOffset < y && y < annotation_box[item].y2 + tmp_lineOffset) {
                 return {
                     box: annotation_box[item].index,
                     pos: 's'
                 };
             }
             else if (annotation_box[item].y1 + tmp_lineOffset < y && y < annotation_box[item].y2 - tmp_lineOffset) {
                 if (ctrl_key === 1) {
                     return {
                         box: annotation_box[item].index,
                         pos: 'move'
                     };
                 }
             }
        }
    }
    return {
      box: -1,
      pos: 'o'
    };
}

$(document).keydown(function (event) {
    // 键盘按下时触发
	// console.log('key down');
	if(event.which == 17){
	    ctrl_key = 1
    }
})

$(document).keyup(function (event) {
    // 键盘抬起时触发
	// console.log('key down');
	if(event.which == 17){
	    ctrl_key = 0
    }
})

document.getElementById('canvas').onmousedown =  function (e){
    context.strokeStyle = box_color
    startx = e.offsetX
    starty = e.offsetY
    // context.strokeRect(startx,starty,0,0)
    if(e.button === 0) {
        mousedown = 1;
        x1 = e.offsetX;
        y1 = e.offsetY;
        x2 = e.offsetX;
        y2 = e.offsetY;
        clickedArea = findCurrentArea(e.offsetX, e.offsetY);
        // console.log('------', clickedArea.pos)
        var checkedToothPosition = $('input[name="tooth"]:checked').val();
        var current_tooth = document.getElementsByName(checkedToothPosition)[0]
        // console.log(clickedArea.pos)
        if(clickedArea.box === -1){
            if(current_tooth.style.background === 'green'){
                layer.msg('同一牙位请勿重复标注');
                mousedown = 0;
                return ;
            }
        }
    }
}

// 鼠标移动
document.getElementById('canvas').onmousemove = function (e){
    current_x = e.offsetX
    current_y = e.offsetY
    context.strokeStyle = box_color
     $('#cur_loc').html(Math.round(current_x / scale) + ',' + Math.round(current_y / scale));
    // moveArea = findCurrentArea(e.offsetX, e.offsetY);

    canvas_item.style.cursor = "default";
    context.clearRect(0,0,canvas_item.width,canvas_item.height)
    // console.log('清空')
    drawpicture();
    if(mousedown  && clickedArea.box === -1)
    {
        context.strokeRect(startx,starty,e.offsetX-startx,e.offsetY-starty)
        drawonbox();
    }
        //把之前的画上

    else if(mousedown && clickedArea.box !== -1){
        // console.log('boxid',clickedArea.box)
        x2 = e.offsetX;
        y2 = e.offsetY;
        xOffset = x2 - x1;
        yOffset = y2 - y1;
        x1 = x2;
        y1 = y2;
        if (clickedArea.pos === 'move' ||
            clickedArea.pos === 'nw' ||
            clickedArea.pos === 'w' ||
            clickedArea.pos === 'sw') {
            annotation_box[clickedArea.box].x1 += xOffset;
            annotation_box[clickedArea.box].realx1 = annotation_box[clickedArea.box].x1 / scale;
          }
          if (clickedArea.pos === 'move' ||
              clickedArea.pos === 'nw' ||
            clickedArea.pos === 'n' ||
            clickedArea.pos === 'ne') {
            annotation_box[clickedArea.box].y1 += yOffset;
            annotation_box[clickedArea.box].realy1 = annotation_box[clickedArea.box].y1 / scale;
          }
          if (clickedArea.pos === 'move' ||
              clickedArea.pos === 'ne' ||
            clickedArea.pos === 'e' ||
            clickedArea.pos === 'se') {
            annotation_box[clickedArea.box].x2 += xOffset;
            annotation_box[clickedArea.box].realx2 = annotation_box[clickedArea.box].x2 / scale;
          }
          if (clickedArea.pos === 'move' ||
              clickedArea.pos === 'sw' ||
              clickedArea.pos === 's' ||
              clickedArea.pos === 'se') {
            annotation_box[clickedArea.box].y2 += yOffset;
            annotation_box[clickedArea.box].realy2 = annotation_box[clickedArea.box].y2 / scale;
          }
          drawonbox();
    }

    else if (!mousedown) {
        drawonbox();
        //console.log('move :', e.offsetX, e.offsetY)
        tmp_cursor = findCurrentArea(e.offsetX, e.offsetY)
        if (tmp_cursor.box !== -1) {
            if (tmp_cursor.pos === 'ne') {
                canvas_item.style.cursor = "ne-resize";
            }
            else if (tmp_cursor.pos === 'nw') {
                canvas_item.style.cursor = "nw-resize";
            }
            else if (tmp_cursor.pos === 'sw') {
                canvas_item.style.cursor = "sw-resize";
            }
            else if (tmp_cursor.pos === 'w') {
                canvas_item.style.cursor = "w-resize";
            }
            else if (tmp_cursor.pos === 'n') {
                canvas_item.style.cursor = "n-resize";
            }
            else if (tmp_cursor.pos === 's') {
                canvas_item.style.cursor = "s-resize";
            }
            else if (tmp_cursor.pos === 'e') {
               canvas_item.style.cursor = "e-resize";
            }
            else if (tmp_cursor.pos === 'ne') {
                canvas_item.style.cursor = "ne-resize";
            }
            else if (tmp_cursor.pos === 'se') {
                canvas_item.style.cursor = "se-resize";
            }
            else if (tmp_cursor.pos === 'move') {
                canvas_item.style.cursor = "move";
            }
        }
        else {
            canvas_item.style.cursor = "auto";
        }
    }
}

document.getElementById('canvas').onmouseup = function (e){
    // console.log('--抬起', e.offsetX)
    // console.log(annotation_box)
    if(mousedown && clickedArea.box === -1 && e.offsetX !== startx){
        // console.log(allNotIn)
        var regionLoc = current_x + ',' + current_y; //2个坐标
        $('#cur_loc').html(regionLoc);
        //标签类别
        var regionClass = $('#ann input:checked').val();
        //牙位
        var checkedToothPosition = $('input[name="tooth"]:checked').val();
        tmpBox = newBox(startx,starty,current_x,current_y,allNotIn,checkedToothPosition,regionClass)
        if(tmpBox !== null){
            annotation_box.push(tmpBox)
            allNotIn++;
            var current_tooth = document.getElementsByName(checkedToothPosition)[0]
            if(current_tooth.style.background === 'green'){
                //layer.msg('同一牙位请勿重复标注');
                return ;
            }
            current_tooth.style.background = 'green';
            updateToothRadio();
            drawonbox();
        }
    }
    else if(mousedown && clickedArea.box !== -1){
        drawonbox()
    }
    // console.log(annotation_box)
    mousedown = 0

    tmpBox = null;
}

//右键
document.getElementById('canvas').oncontextmenu = function (e){
    rightclickedArea = findCurrentArea(e.offsetX, e.offsetY);
    // console.log(rightclickedArea)
    if(rightclickedArea.box !== -1){
        annotation_box.forEach((item,cur_index)=>{
            if(item.index == rightclickedArea.box){
                var target_tooth = item.toothPosition
                var current_tooth = document.getElementsByName(target_tooth)[0]
                current_tooth.style.background = '#7F9CCB';
                annotation_box.splice(cur_index, 1)
            }
        });
        // console.log(annotation_box)
        //确保index和下标一一对应
        annotation_box.forEach((item,cur_index)=>{
            item.index = cur_index
            allNotIn = item.index
        });
        allNotIn++;
        drawonbox();
        return false;
    }
    return false;
    // console.log(annotation_box)
}



//牙位更新radio
function updateToothRadio(){
    var all_radio = document.getElementsByName("tooth");
    var radio_length = all_radio.length;
    for (var i = 0; i < radio_length; i++) {
        if (all_radio[i].checked) {
            all_radio[i].checked = false;
            if(i === radio_length - 1)
                all_radio[0].checked = true;
            else
                all_radio[i + 1].checked = true;
            break;
        }
    }
}

function initToothStatus() {
    var tooth_status = document.getElementsByClassName('radio-inline')
    var radio_length = tooth_status.length;
    tooth_status[0].children[0].checked = true;
    //状态重置为未标注的
    for(var i=0; i< radio_length; i++)
    {
        tooth_status[i].style.background = '#7F9CCB' ;
    }
}



function drawonbox(){
    //console.log('call on drawonbox')
    annotation_box.forEach(item=>{
        context.beginPath();
        item = fixPosition(item)
        context.strokeStyle = box_color
        context.strokeRect(item.x1,item.y1,item.width,item.height)

        context.font = "15px Normal"
        context.fillStyle = label_color
        context.fillText(item.toothPosition + ":" + item.regionClass, item.x1 - border_size, item.y1 - border_size )
        // context.fillText(item.toothPosition, item.x1 + border_size, item.y2 + border_size )
        // context.fillText(item.regionClass,item.x1 - border_size, item.y1 - border_size)
    });
}

function computereloadbox(){
    //console.log('call on drawonbox')
    annotation_box.forEach(item=>{
        // item.x1 = Math.round(item.realx1 * scale)
        // item.y1 = Math.round(item.realy1 * scale)
        // item.x2 = Math.round(item.realx2 * scale)
        // item.y2 = Math.round(item.realy2 * scale)
        item.x1 = item.realx1 * scale
        item.y1 = item.realy1 * scale
        item.x2 = item.realx2 * scale
        item.y2 = item.realy2 * scale
        item.width = item.realwidth * scale
        item.height = item.realheight * scale
        allNotIn = item.index
    });
}

function reloadtoothstatus(){
     annotation_box.forEach(item=>{
        var tooth_status = document.getElementsByName(item.toothPosition)[0]
         tooth_status.style.background = 'green';
    });

}


 // 计算矩形框的宽和高
function fixPosition(position){
    if(position.x1>position.x2){
        let x=position.x1;
        position.x1=position.x2;
        position.x2=x;
    }
    if(position.y1>position.y2){
        let y=position.y1;
        position.y1=position.y2;
        position.y2=y;
    }
    position.width=position.x2-position.x1
    position.height=position.y2-position.y1
    position.realwidth=position.realx2-position.realx1
    position.realheight=position.realy2-position.realy1

    return position
}

function newBox(x1, y1, x2, y2,cur_idx,toothPosition,regionClass) {
    // console.log('call newBox')
    boxX1 = x1 < x2 ? x1 : x2;
    boxY1 = y1 < y2 ? y1 : y2;
    boxX2 = x1 > x2 ? x1 : x2;
    boxY2 = y1 > y2 ? y1 : y2;

    if (boxX2 - boxX1 > lineOffset * 2 && boxY2 - boxY1 > lineOffset * 2) {
        return {
            x1: boxX1,
            y1: boxY1,
            x2: boxX2,
            y2: boxY2,
            // realx1 : Math.round(x1 / scale),
            // realx2 : Math.round(x2 / scale),
            // realy1 : Math.round(y1 / scale),
            // realy2 : Math.round(y2 / scale),
            realx1 : x1 / scale,
            realx2 : x2 / scale,
            realy1 : y1 / scale,
            realy2 : y2 / scale,

            index: cur_idx,
            toothPosition:toothPosition,
            regionClass:regionClass
        };
    }
    else {
        return null;
   }
}


function get_labels() {
    $.ajax({
        type: "GET",
        dataType: "json",
        url: "/api/annotation/labels?" + new Date(),
        beforeSend: function() {},
        success: function(result) {
            if (result.message == '保存成功！') {
                var html = '<span><b>标注类型</b></span><br/><br/><span></span><div class="form-group" id="ann" name="annotation">';
                index = 0;
                for (var i in result.data) {
                    var id = 'region_' + result.data[i].name;
                    var value = result.data[i].name;
                    var text = result.data[i].desc;
                    // 修改标注类型,默认选中第一个
                    if (index == 0) {
                        html += '<label class="radio-inline"><input type="radio" checked name="annotation-item" id="' + id + '" value="' + value + '">';
                    } else {
                        html += '<label class="radio-inline"><input type="radio" name="annotation-item" id="' + id + '" value="' + value + '">';
                    }
                    html += ' ' + text + '</label>';
                    index++;
                }
                html += '</div>';
                $('#annotation-type').html(html);
            }
        },
        error: function() {}
    });
}