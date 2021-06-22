import cv2
import numpy as np
from PIL import Image
from torch.utils.data.dataset import Dataset
import math


class YoloDataset(Dataset):
    def __init__(self, train_lines, image_size, is_train):
        super(YoloDataset, self).__init__()

        self.train_lines = train_lines
        self.train_batches = len(train_lines)
        self.image_size = image_size   # h, w
        self.is_train = is_train

    def __len__(self):
        return self.train_batches

    def rand(self, a=0, b=1):
        return np.random.rand() * (b - a) + a

    def get_random_data(self, annotation_line, input_shape, jitter=.3, random=True):
        """实时数据增强的随机预处理"""
        line = annotation_line.split()
        # image = Image.open(line[0])
        cur_npy = np.load(line[0])       # 读取npy数据
        image = Image.fromarray(cur_npy)
        iw, ih = image.size
        h, w = input_shape
        box = np.array([np.array(list(map(int, box.split(',')))) for box in line[1:]])

        if not random:
            scale = min(w/iw, h/ih)
            nw = int(iw*scale)
            nh = int(ih*scale)
            dx = (w-nw)//2
            dy = (h-nh)//2

            image = image.resize((nw,nh), Image.BICUBIC)
            new_image = Image.new('RGB', (w,h), (128,128,128))
            new_image.convert('L')
            new_image1 = new_image.split()[0]
            new_image1.paste(image, (dx, dy))
            # new_image.paste(image, (dx, dy))
            # image_data = np.array(new_image, np.float32)

            # 调整目标框坐标
            box_data = np.zeros((len(box), 5))
            if len(box) > 0:
                np.random.shuffle(box)
                box[:, [0, 2]] = box[:, [0, 2]] * nw / iw + dx
                box[:, [1, 3]] = box[:, [1, 3]] * nh / ih + dy
                box[:, 0:2][box[:, 0:2] < 0] = 0
                box[:, 2][box[:, 2] > w] = w
                box[:, 3][box[:, 3] > h] = h
                box_w = box[:, 2] - box[:, 0]
                box_h = box[:, 3] - box[:, 1]
                box = box[np.logical_and(box_w > 1, box_h > 1)]  # 保留有效框
                box_data = np.zeros((len(box), 5))
                box_data[:len(box)] = box

            return new_image1, box_data
            
        # 调整图片大小
        rand1 = self.rand(1 - jitter, 1 + jitter)
        rand2 = self.rand(1 - jitter, 1 + jitter)
        new_ar = w / h * rand1 / rand2
        scale = self.rand(0.5, 1.5)
        if new_ar < 1:
            nh = int(scale * h)
            nw = int(nh * new_ar)
        else:
            nw = int(scale * w)
            nh = int(nw / new_ar)
        image = image.resize((nw, nh), Image.BICUBIC)

        # 放置图片
        if scale > 1:
            dx = int(self.rand(0, (w - nw) / 2))
            dy = int(self.rand(0.1 * (h - nh), 0.9 * (h - nh)))
        else:
            dx = int(self.rand(0, w - nw))
            dy = int(self.rand(0, h - nh))
        new_image = Image.new('RGB', (w, h), (128, 128, 128))
        new_image.convert('L')
        new_image1 = new_image.split()[0]
        new_image1.paste(image, (dx, dy))
        image = new_image1


        # 是否翻转图片
        flip = self.rand() < .5
        if flip:
            image = image.transpose(Image.FLIP_LEFT_RIGHT)


        # 调整目标框坐标
        box_data = np.zeros((len(box), 5))
        if len(box) > 0:
            np.random.shuffle(box)
            box[:, [0, 2]] = box[:, [0, 2]] * nw / iw + dx
            box[:, [1, 3]] = box[:, [1, 3]] * nh / ih + dy
            if flip:
                box[:, [0, 2]] = w - box[:, [2, 0]]
            box[:, 0:2][box[:, 0:2] < 0] = 0
            box[:, 2][box[:, 2] > w] = w
            box[:, 3][box[:, 3] > h] = h
            box_w = box[:, 2] - box[:, 0]
            box_h = box[:, 3] - box[:, 1]
            box = box[np.logical_and(box_w > 1, box_h > 1)]  # 保留有效框
            box_data = np.zeros((len(box), 5))
            box_data[:len(box)] = box
            
        return image, box_data

    def __getitem__(self, index):
        lines = self.train_lines
        n = self.train_batches
        index = index % n
        if self.is_train:
            img, box_data = self.get_random_data(lines[index], self.image_size[0:2], random=True)
        else:
            img, box_data = self.get_random_data(lines[index], self.image_size[0:2], random=False)

        # gama变换
        image_np = np.array(img, np.float32)
        detection_value = []
        for index in range(len(box_data)):
            left, top, right, bottom = box_data[index][0:4]
            detection_value.append(image_np[int(top)][int(left)])

        detection_np = np.array(detection_value, dtype=np.float32)
        mean = np.mean(detection_np)
        gamma_val = math.log10(0.5) / math.log10(mean / 255.0)  # 公式计算gamma

        gama_np = np.power(image_np / float(np.max(detection_np)), gamma_val)
        # 归一至 0-1
        gama_np = np.array(gama_np / (np.max(gama_np) - np.min(gama_np)), dtype=np.float32)

        if len(box_data) != 0:
            # 从坐标转换成0~1的百分比
            boxes = np.array(box_data[:, :4], dtype=np.float32)
            boxes[:, 0] = boxes[:, 0] / self.image_size[1]
            boxes[:, 1] = boxes[:, 1] / self.image_size[0]
            boxes[:, 2] = boxes[:, 2] / self.image_size[1]
            boxes[:, 3] = boxes[:, 3] / self.image_size[0]

            boxes = np.maximum(np.minimum(boxes, 1), 0)
            boxes[:, 2] = boxes[:, 2] - boxes[:, 0]
            boxes[:, 3] = boxes[:, 3] - boxes[:, 1]

            boxes[:, 0] = boxes[:, 0] + boxes[:, 2] / 2
            boxes[:, 1] = boxes[:, 1] + boxes[:, 3] / 2
            box_data = np.concatenate([boxes, box_data[:, -1:]], axis=-1)

        img = np.array(gama_np, dtype=np.float32)
        img = np.expand_dims(img, 2)
        img = np.concatenate((img, img, img), axis=-1)


        tmp_inp = np.transpose(img, (2, 0, 1))
        tmp_targets = np.array(box_data, dtype=np.float32)
        return tmp_inp, tmp_targets

# DataLoader中collate_fn使用
def yolo_dataset_collate(batch):
    images = []
    bboxes = []
    for img, box in batch:
        images.append(img)
        bboxes.append(box)
    images = np.array(images)
    return images, bboxes

