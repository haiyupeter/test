//获取IP
exports.getIp = function(header) {
    var ip;
    // 获取IP
    if (typeof header['x-forwarded-for'] == "string") {
        ip = header['x-forwarded-for'];
    } else {
        ip = header['x-real-ip'];
    }
    if (!ip) {
        ip = "127.0.0.1";
    }
    return ip;
};

/**
 * 转换存储空间大小
 */
exports.formatSize = function(size, unit) {
    if (!unit) {
        if (size < 1024) {
            unit = "B";
        } else if (size < 1048576) {
            unit = "KB";
        } else if (size < 1073741824) {
            unit = "MB";
        } else {
            unit = "GB";
        }
    }
    switch (unit) {
    case "B":
        return size + "B";
    case "KB":
        return (size / 1024).toFixed(2) + "KB";
    case "MB":
        return (size / 1048576).toFixed(2) + "MB";
    case "GB":
        return (size / 1073741824).toFixed(2) + "GB";
    }
};
