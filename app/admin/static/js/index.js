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
var ctrl_key
var annotation_box=[];//图层
var temp_checked_box = [];
var review_box = [];
var total_data;

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

    if(real_size_1_h<=box_h){
        ratio = ratio_base_on_w;
    }
    else if (real_size_2_w<=box_w){
        ratio = ratio_base_on_h;
    }
    return ratio
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

// 入口
function loadImage(result_url,ann_box) {
    //加载图片
    total_data = ann_box
    annotation_box = []
    scale = 1;
    allNotIn = 0;
    mousedown = 0;
    new_img = document.getElementById('source')
    new_img.src = result_url

    var image_parent = document.querySelector('.img-main')
    canvas_item_width = canvas_item.width
    canvas_item_height = canvas_item.height
    new_img.onload = function () {
        canvas_item.setAttribute('width', image_parent.clientWidth)
        canvas_item.setAttribute('height', image_parent.clientHeight)

        image_naturalWidth = new_img.naturalWidth
        image_naturalHeight = new_img.naturalHeight

        scale = containImg(canvas_item.width, canvas_item.height, image_naturalWidth, image_naturalHeight)
        realwidth = scale * image_naturalWidth
        realheight = scale * image_naturalHeight
        clear_and_redraw()
        //清除原有的tabel数据
        tbody = document.querySelector('.review')
        while(tbody.firstChild){
            tbody.removeChild(tbody.firstChild)
        }
        review_toothposition = document.getElementById('tooth-position');
        while(review_toothposition.firstChild){
            review_toothposition.removeChild(review_toothposition.firstChild)
        }
        //console.log(ann_box)
        get_labels()
        get_review_data(ann_box)
        drawonbox()
    }
}

function clear_and_redraw(){
    realwidth = scale * image_naturalWidth
    realheight = scale * image_naturalHeight
     context.clearRect(0, 0, canvas_item_width, canvas_item_height)
     context.drawImage(new_img, 0, 0, image_naturalWidth, image_naturalHeight, 0, 0, realwidth, realheight)
}

//添加tabel元素，以及radio信息
function add_tabel_element(ann_item,flag){
    tbody = document.querySelector('.review')

    tr_item = document.createElement('tr')
    th_item = document.createElement('th')
    // th_item.onclick = clickaction(th_item)
    $(th_item).html('<input type="checkbox"  id=' + ann_item.toothPosition + ' class="check_box" />')
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

    if(flag === 'not merge'){
        th_item = document.createElement('th')
        $(th_item).html('多用户标注iou值过小,请重新标注')
        tr_item.appendChild(th_item)
    }
    tbody.appendChild(tr_item)

    review_toothposition = document.getElementById('tooth-position');
    label  = document.createElement('label');
    label.className="radio-inline";
    $(label).html('<input type="radio" value=' + ann_item.toothPosition + ' name="tooth">' + ann_item.toothPosition)
    review_toothposition.appendChild(label)
}

function get_review_data(ann_data){
    for (var key in ann_data){
        var ann_item = ann_data[key];
        if(ann_item['merge']) {
            if(ann_item['review_flag'] === false){
                // allNotIn = ann_item['index']
                // allNotIn++;
                annotation_box.push(ann_item)
                add_tabel_element(ann_item,'merge')
            }
        }
        else {
            add_tabel_element(ann_item,'not merge')
        }
    }
    // console.log(annotation_box)
    computecurrentbox();
}

//审核数据合并
function get_total_data(ann_data){
    for (var key in ann_data){
        var ann_item = ann_data[key];
        if(ann_item['review_flag'] === true){
            // ann_item['index'] = allNotIn
            // allNotIn++;
            annotation_box.push(ann_item)
        }
    }

}

// function draw_review_box(){
//     temp_checked_box.forEach(item=>{
//         var context = document.getElementById("canvas_for_watch").getContext('2d');
//         context.beginPath();
//         item = fixPosition(item)
//         context.strokeStyle = box_color
//         context.strokeRect(item.x1,item.y1,item.width,item.height)
//
//         context.font = "15px Normal"
//         context.fillStyle = label_color
//         context.fillText(item.toothPosition, item.x1 + border_size, item.y2 + border_size )
//         context.fillText(item.regionClass,item.x1 - border_size, item.y1 - border_size)
//     });
//
// }

// function get_checked_review_box(target_tooth){
//     console.log(temp_checked_box)
//     temp_checked_box.forEach(item=>{
//         annotation_box.push(item)
//     })
//     console.log(annotation_box)
//     temp_checked_box = []
//
//     target_tooth.forEach((tooth,review_index)=>{
//         annotation_box.forEach((item,ann_index)=>{
//             if(item.toothPosition == tooth){
//                 // 临时的review下标统一
//                 item.index = review_index
//                 temp_checked_box.push(item)
//                 annotation_box.splice(ann_index, 1)
//             }
//         });
//     });
//     //确保index和下标一一对应
//     annotation_box.forEach((item,cur_index)=>{
//         item.index = cur_index
//         allNotIn = item.index
//     });
//     allNotIn++;
// }
//
//
// function clickaction(){
//     tooth_list = document.getElementsByClassName('check_box')
//
//     target_tooth = []
//     for(var i=0; i<tooth_list.length;i++){
//         if(tooth_list[i].checked){
//             target_tooth.push(tooth_list[i].id)
//         }
//     }
//     console.log('target_tooth',target_tooth)
//     clear_and_redraw(context, new_img)
//     get_checked_review_box(target_tooth)
//     console.log(temp_checked_box)
//     draw_review_box()
// }

function computecurrentbox(){
    //console.log('call on drawonbox')
    //console.log(scale)
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
    //console.log('call on drawonbox')
    //console.log(annotation_box)
    annotation_box.forEach(item=>{
        var context = document.getElementById("canvas_for_watch").getContext('2d');
        context.beginPath();
        item = fixPosition(item)
        context.strokeStyle = box_color
        context.strokeRect(item.x1,item.y1,item.width,item.height)

         // 画出中心点
        x_center = (item.x1 + item.x2) / 2;
        y_center = (item.y1 + item.y2) / 2;
        context.beginPath();
        context.arc(x_center ,y_center, 3, 0, Math.PI * 2);
        context.fillStyle = 'orange';
        context.fill();

        context.font = "15px Normal"
        context.fillStyle = label_color
        //console.log(item.toothPosition)
        if(item.toothPosition === 32){
             context.fillText(item.toothPosition + ":" + item.regionClass, item.x1 - border_size, item.y1 - border_size + item.height )
        }
        else{
             context.fillText(item.toothPosition + ":" + item.regionClass, item.x1 - border_size, item.y1 - border_size )
        }
        //context.fillText(item.toothPosition + ":" + item.regionClass, item.x1 - border_size, item.y1 - border_size )
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
        //console.log('------', clickedArea)
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
        drawonbox()
    }
        //把之前的画上

    else if(mousedown && clickedArea.box !== -1){
        //console.log('boxid',clickedArea.box)
        //console.log('更新')
        x2 = e.offsetX;
        y2 = e.offsetY;
        //console.log(x2,y2)
        xOffset = x2 - x1;
        yOffset = y2 - y1;
        x1 = x2;
        y1 = y2;
        //console.log(xOffset,yOffset)
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
              //console.log(annotation_box[clickedArea.box].x2)
            annotation_box[clickedArea.box].x2 += xOffset;
              //console.log(annotation_box[clickedArea.box].x2)
            annotation_box[clickedArea.box].realx2 = annotation_box[clickedArea.box].x2 / scale;
          }
          if (clickedArea.pos === 'move' ||
              clickedArea.pos === 'sw' ||
              clickedArea.pos === 's' ||
              clickedArea.pos === 'se') {
            annotation_box[clickedArea.box].y2 += yOffset;
            annotation_box[clickedArea.box].realy2 = annotation_box[clickedArea.box].y2 / scale;
          }
          drawonbox()
    }

    else if (!mousedown) {
        //console.log('------', clickedArea.pos)
        drawonbox()
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

document.getElementById('canvas_for_watch').onmouseup = function (e){
    if(mousedown && clickedArea.box !== -1){
        drawonbox()
    }
    else if(mousedown && clickedArea.box === -1 && e.offsetX !== startx){
        var new_box = true
        var check_tooth = $('input[name="tooth"]:checked').val()
        //console.log(typeof check_tooth)
        annotation_box.forEach(item=>{
            if(item.toothPosition == check_tooth){
                layer.msg('该牙位已经有标注信息，请修改')
                new_box = false
            }
        })
        if(new_box && check_tooth != undefined){
            var regionClass = $('#ann input:checked').val();
            tmpBox = newBox(startx,starty,current_x,current_y,allNotIn,check_tooth,regionClass)
            if(tmpBox !== null){
                annotation_box.push(tmpBox)
                allNotIn++;
                drawonbox();
            }
        }

    }
    // console.log(annotation_box)
    mousedown = 0
    tmpBox = null;
}

//右键
document.getElementById('canvas_for_watch').oncontextmenu = function (e){
    rightclickedArea = findCurrentArea(e.offsetX, e.offsetY);
    // console.log(rightclickedArea)
    if(rightclickedArea.box !== -1){
        annotation_box.forEach((item,cur_index)=>{
            if(cur_index == rightclickedArea.box){
                annotation_box.splice(cur_index, 1)
            }
        });
        // console.log(annotation_box)
        //确保index和下标一一对应
        /*annotation_box.forEach((item,cur_index)=>{
            item.index = cur_index
            allNotIn = item.index
        });
        allNotIn++;*/
        drawonbox();
        // 不传递
        return false;
    }
    return false;
    // console.log(annotation_box)
}

function newBox(x1, y1, x2, y2,cur_idx,toothPosition,regionClass) {
    //console.log('call newBox')
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

            //index: cur_idx,
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
    for (var item = 0; item < annotation_box.length; item++){
         if (annotation_box[item].x1 - tmp_lineOffset < x && x < annotation_box[item].x1 + tmp_lineOffset) {
             if (annotation_box[item].y1 - tmp_lineOffset < y && y < annotation_box [item].y1 + tmp_lineOffset) {
                 return {
                     //box: annotation_box[item].index,
                     box:item,
                     pos: 'nw'
                 };
             }
             else if (annotation_box[item].y2 - tmp_lineOffset < y && y < annotation_box[item].y2 + tmp_lineOffset) {
                 return {
                     box:item,
                     //box: annotation_box[item].index,
                     pos: 'sw'
                 };
             }
             else if (annotation_box[item].y1 + tmp_lineOffset < y && y < annotation_box[item].y2 - tmp_lineOffset) {
                 return {
                     box:item,
                     //box: annotation_box[item].index,
                     pos: 'w'
                 };
             }
         }
         else if(annotation_box[item].x2 - tmp_lineOffset < x && x < annotation_box[item].x2 + tmp_lineOffset){
             if (annotation_box[item].y1 - tmp_lineOffset < y && y < annotation_box[item].y1 + tmp_lineOffset) {
                 return {
                     box:item,
                     //box: annotation_box[item].index,
                     pos: 'ne'
                 };
             }
             else if (annotation_box[item].y2 - tmp_lineOffset < y && y < annotation_box[item].y2 + tmp_lineOffset) {
                 return {
                     box:item,
                     //box: annotation_box[item].index,
                     pos: 'se'
                 };
             }
             else if (annotation_box[item].y1 + tmp_lineOffset < y && y < annotation_box[item].y2 - tmp_lineOffset) {
                 return {
                     box:item,
                     //box: annotation_box[item].index,
                     pos: 'e'
                 };
             }

         }
         else if (annotation_box[item].x1 + tmp_lineOffset < x && x < annotation_box[item].x2 - tmp_lineOffset) {
             if (annotation_box[item].y1 - tmp_lineOffset < y && y < annotation_box[item].y1 + tmp_lineOffset) {
                 return {
                     box:item,
                     //box: annotation_box[item].index,
                     pos: 'n'
                 };
             }
             else if (annotation_box[item].y2 - tmp_lineOffset < y && y < annotation_box[item].y2 + tmp_lineOffset) {
                 return {
                     box:item,
                     //box: annotation_box[item].index,
                     pos: 's'
                 };
             }
             else if (annotation_box[item].y1 + tmp_lineOffset < y && y < annotation_box[item].y2 - tmp_lineOffset) {
                 if (ctrl_key === 1) {
                     return {
                         box:item,
                         //box: annotation_box[item].index,
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



$('#btn_save').click(function() {
    var imagename = $("#image_id option:selected").text().split('----')[0]
    if(confirm('您确定要保存  <'+imagename+'>  的审核信息吗？')) {
        shootdate = $('#datetips').val()
        //console.log(typeof shootdate)
        if(shootdate == ""){
            layer.msg('拍片日期还未设置！')
            return
        }
        get_total_data(total_data)
        // console.log(annotation_box)
        // computecurrentbox()
        // clear_and_redraw()
        // drawonbox()
        // console.log(annotation_box,user_name,picNameStr,shootdate,today)
        saveReviewInfo(annotation_box,imagename,shootdate);
    }
});

function saveReviewInfo(annotation_box,picNameStr,shootdate) {
    annotation_box_json = JSON.stringify(annotation_box)
    if(annotation_box_json == '{}'){
        alert('没有标注信息！')
        return
    }
    // console.log(annotation_box_json)
     $.ajax({
        type: "POST",
        dataType: "json",
        url: "/admin/api/annotation/review/save?" + new Date(),
        data: { 'ann_info':annotation_box_json, 'pic_name' : picNameStr, 'shoot_date':shootdate},
        beforeSend: function() {},
        success: function(result) {
            layer.msg(result.message);
            setTimeout("location.reload();","1000")
            //location.reload();
        },
        error: function() {}
     });
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


$('#annotation-type').click(function() {
    // tooth_list = document.getElementsByClassName('check_box')
    // target_tooth = []
    // for(var i=0; i<tooth_list.length;i++){
    //     if(tooth_list[i].checked){
    //         target_tooth.push(tooth_list[i].id)
    //     }
    // }
    // console.log(target_tooth)
    // if(target_tooth.length > 1){
    //     layer.msg('请勿同时勾选多个!')
    //
    // }
    // else if(target_tooth.length == 1){
    //     var regionClass = $('#ann input:checked').val();
    //     var toothPosition = target_tooth[0]
    //     updateRegionClass(regionClass,toothPosition);
    // }
    var regionClass = $('#ann input:checked').val();
    var toothPosition = $('input[name="tooth"]:checked').val()
    updateRegionClass(regionClass,toothPosition);
    clear_and_redraw()
    drawonbox();
});


function updateRegionClass(regionClass,toothPosition){
    annotation_box.forEach(item=>{
        if(item.toothPosition == toothPosition){
            if(item.regionClass != regionClass){
                item.regionClass = regionClass;
                layer.msg('牙评分更新成功')
                return ;
            }
        }
    })
}