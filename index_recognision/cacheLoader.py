from doctr.models import recognition_predictor, detection_predictor
recognition_predictor("crnn_vgg16_bn", pretrained=True)
detection_predictor("fast_base", pretrained=True)