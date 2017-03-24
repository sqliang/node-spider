/**
 * Created by baidu on 17/3/19.
 */
"use strict";
var http = require('http');
var url = require('url');
var superagent = require('superagent');//http库,可以发起请求;
var cheerio = require('cheerio');//node里的类Jquery
var async = require('async');
var eventproxy = require('eventproxy');


var ep = new eventproxy();
var urlStr = 'https://cnodejs.org/';

superagent.get(urlStr).end(function (err, res) {
    if(err) {
        console.error(err);
    }
    var $ = cheerio.load(res.text);
    var topicUrls = [];
    $('#topic_list .topic_title').each(function(index,elem){
        var $elem = $(elem);
        var href = url.resolve(urlStr,$elem.attr('href'));
        topicUrls.push(href);
    });
    var len = topicUrls.length;
    ep.after('topic_html', len, function (topics) {
        // topics 是个数组，包含了 40 次 ep.emit('topic_html', pair) 中的那 40 个 pair

        // 开始行动
        topics = topics.map(function (topicPair) {
            // 接下来都是 jquery 的用法了
            var topicUrl = topicPair[0];
            var topicHtml = topicPair[1];
            var $ = cheerio.load(topicHtml);
            return ({
                title: $('.topic_full_title').text().trim(),
                href: topicUrl,
                comment1: $('.reply_content').eq(0).text().trim(),
            });
        });

        console.log('final:');
        console.log(topics);
    });

    topicUrls.forEach(function (topicUrl) {
        superagent.get(topicUrl)
            .end(function (err, res) {
                console.log('fetch ' + topicUrl + ' successful');
                ep.emit('topic_html', [topicUrl, res.text]);
            });
    });
});
