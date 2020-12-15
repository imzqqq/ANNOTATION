var canvas_item = document.getElementById('canvas_for_watch')
context = canvas_item.getContext("2d")
var scale = 1
var image_naturalWidth, image_naturalHeight
var box_color="#0000ff"
var label_color = 'red';
var border_size = 2;
allNotIn = 0;
var new_img
var canvas_item_width, canvas_item_height

var clickedArea = {
  box: -1,
  pos: 'o'
};

var tmpBox = null

var x1 = -1;
var y1 = -1;
var x2 = -1;
var y2 = -1;

var startx,//起始x坐标
    starty,//起始y坐标
    mousedown,//是否点击鼠标的标志
    current_x,
    current_y,
    allNotIn = 0;

var target_tooth = []

var annotation_box=[];//图层
var temp_checked_box = [];
var review_box = [];

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

    if(real_size_1_h<=source_h){
        ratio = ratio_base_on_w;
    }
    else if (real_size_2_w<=source_w){
        ratio = ratio_base_on_h;
    }
    return ratio
}


function loadImage(result_url,action,ann_box) {
    //加载图片

    // console.log(annotation_box)
    new_img = document.getElementById('source')
    new_img.src = result_url

    var image_parent = document.querySelector('.img-main')

    // var canvas_for_watch = document.createElement('canvas')
    // canvas_for_watch.id = "canvas_for_watch"
    // image_parent.appendChild(canvas_for_watch)

    // var context = document.getElementById("canvas_for_watch").getContext('2d');
    //
    // var canvas_item = document.getElementById('canvas_for_watch')
    canvas_item_width = canvas_item.width
    canvas_item_height = canvas_item.height
    new_img.onload = function () {
        canvas_item.setAttribute('width', image_parent.clientWidth)
        canvas_item.setAttribute('height', image_parent.clientHeight)

        image_naturalWidth = new_img.naturalWidth
        image_naturalHeight = new_img.naturalHeight
        // console.log(image_naturalWidth,image_naturalHeight)
        // console.log(canvas_item.width)
        // console.log(canvas_item.height)
        scale = 1
        scale = containImg(canvas_item.width, canvas_item.height, image_naturalWidth, image_naturalHeight)
        realwidth = scale * image_naturalWidth
        realheight = scale * image_naturalHeight
        // context.clearRect(0, 0, canvas_item.width, canvas_item.height)
        // context.drawImage(new_img, 0, 0, image_naturalWidth, image_naturalHeight, 0, 0, realwidth, realheight)
        clear_and_redraw()
        if(action === 'view') {
            annotation_box = ann_box
            drawonbox()
        }
        else{
            display_review_data(ann_box)
        }
    }
}

function clear_and_redraw(){
    realwidth = scale * image_naturalWidth
    realheight = scale * image_naturalHeight
     context.clearRect(0, 0, canvas_item_width, canvas_item_height)
     context.drawImage(new_img, 0, 0, image_naturalWidth, image_naturalHeight, 0, 0, realwidth, realheight)
}


function display_review_data(ann_data){
    for (var key in ann_data){
        var ann_item = ann_data[key];
        if(ann_item['merge']) {
            ann_item['index'] =  allNotIn;
            allNotIn++;
            annotation_box.push(ann_item)
            console.log(annotation_box)
        }
        else {
            for(var i=0; i<ann_item['ann_list'].length; i++){
                console.log(ann_item['ann_list'][i])
                ann_item['ann_list'][i]['index'] = allNotIn;
                allNotIn++;
                annotation_box.push(ann_item['ann_list'][i])
            }
        }

        tbody = document.querySelector('.review')

        tr_item = document.createElement('tr')
        th_item = document.createElement('th')
        th_item.onclick = clickaction(th_item)
        $(th_item).html('<input type="checkbox"  id=' + key + ' class="check_box"  onclick="clickaction(' + key +')" />')
        tr_item.appendChild(th_item)

        th_item = document.createElement('th')
        $(th_item).html(ann_item.toothPosition)
        tr_item.appendChild(th_item)

        th_item = document.createElement('th')
        $(th_item).html(ann_item.annotationUser)
        tr_item.appendChild(th_item)

        th_item = document.createElement('th')
        $(th_item).html(ann_item.regionClass)
        tr_item.appendChild(th_item)

        tbody.appendChild(tr_item)
    }
    console.log(annotation_box)
    computecurrentbox();
}
function draw_review_box(){
    console.log('call on draw_review_box')
    console.log(temp_checked_box)
    temp_checked_box.forEach(item=>{
        var context = document.getElementById("canvas_for_watch").getContext('2d');
        context.beginPath();
        item = fixPosition(item)
        context.strokeStyle = box_color
        context.strokeRect(item.x1,item.y1,item.width,item.height)

        context.font = "15px Normal"
        context.fillStyle = label_color
        context.fillText(item.toothPosition, item.x1 + border_size, item.y2 + border_size )
        context.fillText(item.regionClass,item.x1 - border_size, item.y1 - border_size)
    });

}

function get_checkedbox(target_tooth){
    console.log(temp_checked_box)
    temp_checked_box.forEach(item=>{
        annotation_box.push(item)
    })
    console.log(annotation_box)
    temp_checked_box = []

    target_tooth.forEach(tooth=>{
        annotation_box.forEach((item,cur_index)=>{
            if(item.toothPosition == tooth){
                temp_checked_box.push(item)
                annotation_box.splice(cur_index, 1)
            }
        });
    });

}


function clickaction(){
    tooth_list = document.getElementsByClassName('check_box')

    target_tooth = []
    for(var i=0; i<tooth_list.length;i++){
        if(tooth_list[i].checked){
            target_tooth.push(tooth_list[i].id)
        }
    }
    console.log(target_tooth)
    clear_and_redraw(context, new_img)
    get_checkedbox(target_tooth)
    draw_review_box()
}

function computecurrentbox(){
    //console.log('call on drawonbox')
    console.log(scale)
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
        //allNotIn = item.index
    });
}

function drawonbox(){
    console.log('call on drawonbox')
    console.log(annotation_box)
    annotation_box.forEach(item=>{
        var context = document.getElementById("canvas_for_watch").getContext('2d');
        context.beginPath();
        item = fixPosition(item)
        context.strokeStyle = box_color
        context.strokeRect(item.x1,item.y1,item.width,item.height)

        context.font = "15px Normal"
        context.fillStyle = label_color
        context.fillText(item.toothPosition, item.x1 + border_size, item.y2 + border_size )
        context.fillText(item.regionClass,item.x1 - border_size, item.y1 - border_size)
    });
}

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

document.getElementById('canvas_for_watch').onmousedown =  function (e){
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
        console.log('------', clickedArea.pos)
    }
}

// 鼠标移动
document.getElementById('canvas_for_watch').onmousemove = function (e){
    current_x = e.offsetX
    current_y = e.offsetY
    context.strokeStyle = box_color

    // moveArea = findCurrentArea(e.offsetX, e.offsetY);

    canvas_item.style.cursor = "default";
    context.clearRect(0,0,canvas_item.width,canvas_item.height)
    //console.log('清空')
    clear_and_redraw()
    if(mousedown  && clickedArea.box === -1)
    {
        context.strokeRect(startx,starty,e.offsetX-startx,e.offsetY-starty)
        draw_review_box(target_tooth)
    }
        //把之前的画上

    else if(mousedown && clickedArea.box !== -1){
        // console.log('boxid',clickedArea.box)
        console.log('更新')
        x2 = e.offsetX;
        y2 = e.offsetY;
        console.log(x2,y2)
        xOffset = x2 - x1;
        yOffset = y2 - y1;
        x1 = x2;
        y1 = y2;
        console.log(xOffset,yOffset)
        if (clickedArea.pos === 'nw' ||
            clickedArea.pos === 'w' ||
            clickedArea.pos === 'sw') {
            temp_checked_box[clickedArea.box].x1 += xOffset;
            temp_checked_box[clickedArea.box].realx1 = temp_checked_box[clickedArea.box].x1 / scale;
          }
          if (clickedArea.pos === 'nw' ||
            clickedArea.pos === 'n' ||
            clickedArea.pos === 'ne') {
            temp_checked_box[clickedArea.box].y1 += yOffset;
            temp_checked_box[clickedArea.box].realy1 = temp_checked_box[clickedArea.box].y1 / scale;
          }
          if (clickedArea.pos === 'ne' ||
            clickedArea.pos === 'e' ||
            clickedArea.pos === 'se') {
              console.log(temp_checked_box[clickedArea.box].x2)
            temp_checked_box[clickedArea.box].x2 += xOffset;
              console.log(temp_checked_box[clickedArea.box].x2)
            temp_checked_box[clickedArea.box].realx2 = temp_checked_box[clickedArea.box].x2 / scale;
          }
          if (clickedArea.pos === 'sw' ||
              clickedArea.pos === 's' ||
              clickedArea.pos === 'se') {
            temp_checked_box[clickedArea.box].y2 += yOffset;
            temp_checked_box[clickedArea.box].realy2 = temp_checked_box[clickedArea.box].y2 / scale;
          }
          draw_review_box(target_tooth)
    }

    else if (!mousedown) {
        console.log('------', clickedArea.pos)
        draw_review_box(target_tooth)
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
        }
        else {
            canvas_item.style.cursor = "auto";
        }
    }
}

document.getElementById('canvas_for_watch').onmouseup = function (e){
    if(clickedArea.box !== -1){
        draw_review_box(target_tooth)
    }
    // console.log(annotation_box)
    mousedown = 0
}


function newBox(x1, y1, x2, y2,cur_idx,toothPosition,regionClass) {
    console.log('call newBox')
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

var lineOffset = 2;
function findCurrentArea(x,y){
    //console.log('---=====',x,y)
    //console.log(layers)
    tmp_lineOffset = lineOffset * 3;
    for (var item = 0; item < temp_checked_box.length; item++){
         if (temp_checked_box[item].x1 - tmp_lineOffset < x && x < temp_checked_box[item].x1 + tmp_lineOffset) {
             if (temp_checked_box[item].y1 - tmp_lineOffset < y && y < temp_checked_box [item].y1 + tmp_lineOffset) {
                 return {
                     box: temp_checked_box[item].index,
                     pos: 'nw'
                 };
             }
             else if (temp_checked_box[item].y2 - tmp_lineOffset < y && y < temp_checked_box[item].y2 + tmp_lineOffset) {
                 return {
                     box: temp_checked_box[item].index,
                     pos: 'sw'
                 };
             }
             else if (temp_checked_box[item].y1 + tmp_lineOffset < y && y < temp_checked_box[item].y2 - tmp_lineOffset) {
                 return {
                     box: temp_checked_box[item].index,
                     pos: 'w'
                 };
             }
         }
         else if(temp_checked_box[item].x2 - tmp_lineOffset < x && x < temp_checked_box[item].x2 + tmp_lineOffset){
             if (temp_checked_box[item].y1 - tmp_lineOffset < y && y < temp_checked_box[item].y1 + tmp_lineOffset) {
                 return {
                     box: temp_checked_box[item].index,
                     pos: 'ne'
                 };
             }
             else if (temp_checked_box[item].y2 - tmp_lineOffset < y && y < temp_checked_box[item].y2 + tmp_lineOffset) {
                 return {
                     box: temp_checked_box[item].index,
                     pos: 'se'
                 };
             }
             else if (temp_checked_box[item].y1 + tmp_lineOffset < y && y < temp_checked_box[item].y2 - tmp_lineOffset) {
                 return {
                     box: temp_checked_box[item].index,
                     pos: 'e'
                 };
             }

         }
         else if (temp_checked_box[item].x1 + tmp_lineOffset < x && x < temp_checked_box[item].x2 - tmp_lineOffset) {
             if (temp_checked_box[item].y1 - tmp_lineOffset < y && y < temp_checked_box[item].y1 + tmp_lineOffset) {
                 return {
                     box: temp_checked_box[item].index,
                     pos: 'n'
                 };
             }
             else if (temp_checked_box[item].y2 - tmp_lineOffset < y && y < temp_checked_box[item].y2 + tmp_lineOffset) {
                 return {
                     box: temp_checked_box[item].index,
                     pos: 's'
                 };
             }
        }
    }
    return {
      box: -1,
      pos: 'o'
    };
}



 $('#btn_save').click(function() {
        var imagename = $("#image_id option:selected").text()
        if(confirm('您确定要保存  <'+imagename+'>  的审核信息吗？')) {

            user = document.getElementsByClassName("avatar");
            user_name =  user[0].alt;
            var time = new Date();
            day = ("0" + time.getDate()).slice(-2);
            month = ("0" + (time.getMonth() + 1)).slice(-2);
            var today = time.getFullYear() + "-" + (month) + "-" + (day);
            console.log(annotation_box,user_name,picNameStr,shootdate,today)
            saveRegionInfo(annotation_box,user_name,picNameStr,shootdate,today);
        }
    });
