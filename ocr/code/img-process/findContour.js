const cv = require('opencv');
const fs = require('fs');
const Jimp = require('jimp');

const height = 15, width = 10;
const nguong = 128;
const whitePixel = Jimp.rgbaToInt(255, 255, 255, 255);
const blackPixel = Jimp.rgbaToInt(0, 0, 0, 255);
const WHITE = [255, 255, 255];
const GREEN = [0, 255, 0];
const thickness = 1;
const Promise = require("bluebird");


module.exports = {
    PreProcess,
}

function PreProcess(imgDir, imgName, option) {
    return new Promise(function (resolve, reject) {
        Jimp.read(imgDir + imgName, function (err, imgJimp) {
            if (err) {
                return reject(err);
            }
            imgJimp.greyscale(function (err, imgGray) {
                imgGray.getBuffer(Jimp.AUTO, function (err, buff) {
                    if (err) {
                        return reject(err);
                    }
                    cv.readImage(buff, function (err, img) {
                        if (err) {
                            return reject(err);
                        }
                        const width = img.width();
                        const height = img.height();

                        if (width < 1 || height < 1) {
                            reject(new Error('Image has no size'));
                        }
                        let imgSave = img.copy();

                        // Chuyen trang den
                        // img = img.adaptiveThreshold(255, 0, 0, 15, 2);

                        // Chuyen ve anh xam
                        // img.convertGrayscale();

                        // lam mo
                        // img.medianBlur(1);

                        // khu nhieu gaussian
                        // img.gaussianBlur([1, 5]);
                        img.gaussianBlur([3, 3]);


                        // khu nhieu
                        const lowThresh = option.lowThresh || 0; // càng lớn càng mất nét
                        const highThresh = option.highThresh || 120; // cang lon loc cang manh
                        img.canny(lowThresh, highThresh);
                        // img.save(imgDir + '_1_' + imgName);

                        // lam beo chu
                        const iterations = 2; // cang lon chu cang beo'
                        img.dilate(iterations);
                        img.erode(1); // xói mòn

                        let processedImg = '_BW_' + imgName;
                        img.save(imgDir + processedImg);


                        let contours = img.findContours();
                        for (var p in contours) {
                            console.log(contours[p]);
                        }

                        let largestContourImg;
                        let largestArea = 0;
                        let largestAreaIndex;

                        for (let i = 0; i < contours.size(); i++) {
                            if (contours.area(i) > largestArea) {
                                largestArea = contours.area(i);
                                largestAreaIndex = i;
                            }
                        }
                        contours.fitEllipse(largestAreaIndex)
                        console.log(largestArea, largestAreaIndex)
                        let bound = contours.boundingRect(largestAreaIndex);
                        img.rectangle([bound.x, bound.y], [bound.width, bound.height], WHITE, 2);
                        imgSave = imgSave.crop(bound.x, bound.y, bound.width, bound.height);
                        imgSave.save(imgDir + 'croped_' + imgName);
                        // img.drawContour(contours, largestAreaIndex, GREEN);
                        // allContoursImg.save(imgDir + "1_" + imgName);
                        // console.log(1111, contours.size())
                        // img.drawAllContours(contours, WHITE);
                        img.save(imgDir + 'contours_' + imgName);
                    });
                });
            })
        })
    })
}
PreProcess('tmp/test/', 'crop.jpg', {})