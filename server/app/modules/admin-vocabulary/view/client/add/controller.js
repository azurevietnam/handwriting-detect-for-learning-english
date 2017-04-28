var vocabularyAddCtrl = (function () {
    'use strict';

    angular
        .module('bzVocabulary')
        .controller('vocabularyAddCtrl', vocabularyAddCtrl);

    function vocabularyAddCtrl($scope, $window, $state, $stateParams, $bzPopup, $uibModal,
        userRoles, authSvc, NgTableParams, ngTableEventsChannel, Upload, bzResourceSvc, vocabularySvc, listClasses, listTypesWord, bzUpload) {
        /* jshint validthis: true */
        var vmAddVocabularys = this;

        /*XÉT QUYỀN TRUY CẬP ROUTER*/
        if (!(authSvc.isSuperAdmin() || (authSvc.isAdmin() && authSvc.hasPermission('vocabulary', ['add'])))) {
            $state.go('error403');
        }
        /*END XÉT QUYỀN TRUY CẬP ROUTER*/

        // Vars
        vmAddVocabularys.classes = '4';
        vmAddVocabularys.formData = {
            status: true,
            lang: 'en',
            classes: 'noun',
            images: []
        };
        vmAddVocabularys.lockFOrm = false;
        vmAddVocabularys.save = create;
        vmAddVocabularys.submitted = false;
        vmAddVocabularys.listClasses = listClasses;
        vmAddVocabularys.listTypesWord = listTypesWord;
        vmAddVocabularys.imagesDirectory = settingJs.configs.uploadDirectory.vocabulary;
        vmAddVocabularys.listImgDelete = [];
        // Methods
        vmAddVocabularys.getUnits = getUnits;
        vmAddVocabularys.uploadImage = uploadImage;
        vmAddVocabularys.removeImage = removeImage;
        vmAddVocabularys.cropImage = cropImage;


        //Init
        getUnits();

        function getUnits() {
            vocabularySvc.getUnits(vmAddVocabularys.classes).then(function (resp) {
                if (resp.success) {
                    vmAddVocabularys.listUnit = resp.data;
                }
                if (vmAddVocabularys.listUnit.length == 0) {
                    $bzPopup.toastr({
                        type: 'error',
                        data: {
                            title: 'Danh sách bài học',
                            message: 'Chưa có bài học. Hãy thêm bài học cho lớp'
                        }
                    });
                }
            }).catch(function (err) {
                vmAddVocabularys.listUnit = [];
                $bzPopup.toastr({
                    type: 'error',
                    data: {
                        title: 'Danh sách bài học',
                        message: 'Xảy ra lỗi. Hãy thêm bài học trước'
                    }
                });
            })
        }

        //Remove image uploaded
        function removeImage(index) {
            vmAddVocabularys.formData.images.splice(index, 1);
        };
        // Upload image
        function uploadImage(file) {
            if (vmAddVocabularys.formData.images.length >= 3) {
                alert("Không thể thêm! Số ảnh tối đa là 5!");
                return false;
            }
            else
                if (file.length > 0 && vmAddVocabularys.formData.images.length < 3) {
                    if (file[0].type == "image/png" || file[0].type == "image/jpeg" || file[0].type == "image/gif") {
                        Upload.upload({
                            url: $window.settings.services.uploadApi + '/upload/file',
                            data: {
                                file: file[0],
                                type: 'vocabulary_image',
                                prefix: 'vocabulary_image',
                            }
                        }).then(function (resp) {
                            vmAddVocabularys.formData.images.push({
                                url: resp.data.filename
                            });
                            $scope.progressPercentage = false;
                            $bzPopup.toastr({
                                type: 'success',
                                data: {
                                    title: 'Thành công!',
                                    message: 'Upload file thành công!'
                                }
                            });
                            vmAddVocabularys.cropImage(vmAddVocabularys.formData.images.length - 1, vmBlogAdd.formData.images[vmBlogAdd.formData.images.length - 1].url);

                        }, function (resp) {
                            $bzPopup.toastr({
                                type: 'error',
                                data: {
                                    title: 'Lỗi!',
                                    message: resp.message
                                }
                            });
                        }, function (evt) {
                            $scope.progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                        });
                    }
                    else {
                        alert("Hỉnh ảnh phải có định dạng là jpg, png hoặc gif!");
                        return;
                    }
                }
        }


        function create(isValid) {
            vmAddVocabularys.submitted = true;
            vmAddVocabularys.lockForm = true;
            if (isValid) {
                vocabularySvc.create(vmAddVocabularys.formData).then(function (resp) {
                    $bzPopup.toastr({
                        type: 'success',
                        data: {
                            title: 'Từ vựng',
                            message: 'Thêm thành công'
                        }
                    });
                    $state.go('vocabularys');
                }).catch(function (error) {
                    $bzPopup.toastr({
                        type: 'error',
                        data: {
                            title: 'Thêm từ vựng',
                            message: error.data.message
                        }
                    });
                });
            }
            else {
                vmAddVocabularys.submitted = true;
            }
        };


        function cropImage(key, url) {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'assets/global/cropper/view.html',
                controller: function ($scope, $uibModalInstance) {
                    var popupScope = this;
                    $scope.popupScope = {
                        image: vmAddVocabularys.imagesDirectory + url,
                        event: 'crop:image',
                        ratio: 1 / 1,
                        width: 100,
                        height: 100,
                        // mimeType : 'image/jpeg'
                    };
                    $scope.$on('crop:image', function (event, image) {
                        bzUpload.uploadBase64({ directory: 'vocabulary_image', image: image.image }).then(function (resp) {
                            var old_image = url;
                            vmAddVocabularys.listImgDelete.push({
                                url: vmAddVocabularys.imagesDirectory,
                                fileName: url
                            });
                            vmAddVocabularys.formData.images[key].url = resp.name;
                            $bzPopup.toastr({
                                type: 'success',
                                data: {
                                    title: 'Thành công!',
                                    message: 'Crop ảnh thành công'
                                }
                            });

                            $uibModalInstance.close();
                        }).catch(function (err) {
                            console.log('er', err);
                        });
                    });
                }
            });
        }
    }

    var resolve = {
        /* @ngInject */
        preload: function (bzPreloadSvc) {
            return bzPreloadSvc.load([]);
        }
    };

    return {
        resolve: resolve
    };
})();