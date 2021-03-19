var canvas_item = document.getElementById('canvas_for_watch')
context = canvas_item.getContext("2d")
var scale = 1
var image_naturalWidth, image_naturalHeight
var box_color="#00ff00"
var label_color = "#ff0000";
var border_size = 2;
allNotIn = 0;
var new_img
var canvas_item_width, canvas_item_height
var review_color = "blue";

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

    if(real_size_1_h<=box_h){
        ratio = ratio_base_on_w;
    }
    else if (real_size_2_w<=box_w){
        ratio = ratio_base_on_h;
    }
    return ratio
}


function loadImage(result_url,ann_box) {
    //加载图片

    new_img = document.getElementById('source')
    new_img.src = result_url

    var image_parent = document.querySelector('.img-watch')

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
        clear_and_redraw()
        annotation_box = ann_box
        computereloadbox();
        drawonbox();

    }
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

function clear_and_redraw(){
    realwidth = scale * image_naturalWidth
    realheight = scale * image_naturalHeight
     context.clearRect(0, 0, canvas_item_width, canvas_item_height)
     context.drawImage(new_img, 0, 0, image_naturalWidth, image_naturalHeight, 0, 0, realwidth, realheight)
}



function drawonbox(){
    console.log('call on drawonbox')
    console.log(annotation_box)
    annotation_box.forEach(item=>{
        item = fixPosition(item)
        context.beginPath();
        if(item.mark == 'mirror'){
            context.strokeStyle = review_color
        }
        else{
            context.strokeStyle = box_color
        }
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
        if(item.toothPosition === 32 || item.toothPosition === 41){
             context.fillText(item.toothPosition + ":" + item.regionClass, item.x1 - border_size, item.y1 - border_size + item.height )
        }
        else {
            context.fillText(item.toothPosition + ":" + item.regionClass, item.x1 - border_size, item.y1 - border_size)
        }
        // context.fillText(item.regionClass,item.x1 - border_size, item.y1 - border_size)
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
