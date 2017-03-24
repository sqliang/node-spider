/**
 * Created by baidu on 17/3/24.
 */
"use strict";

var http = require('http');
var url = require('url');
var superagent = require('superagent');//http库,可以发起请求;
var cheerio = require('cheerio');//node里的类Jquery
var async = require('async');
var eventproxy = require('eventproxy');

var ep = new eventproxy();

var startDate = new Date();
var endDate = false;

var firstUrl = 'https://cnodejs.org/';
var pageNum = 13;
var pageUrls = getPageUrls('all',pageNum);
var urlArray = [];

var len = pageUrls.length;
ep.after('topicArticleHtml',len*40,function(topicUrls){
    console.log('topicUrls.length=' + topicUrls.length);
    //控制并发数量
    var curCount = 0;
    var reptileMove = function(url, callback) {
        curCount++;
        console.warn('此刻并发数=',curCount,'正在抓取:',url,'耗时',1000);
        superagent.get(url).end(function (err, topicRes) {
            if (err){
                console.error(1);
                console.error(err);
            }
            var $ = cheerio.load(topicRes.text);
            //收集topic_title标题,author作者,user_big积分,review浏览次数,changeInfo修改信息
            //comment1,第一个评论
            var topicItem = {
                topic_title: $('.topic_full_title').text().trim(),
                author: $('.user_card .user_name a').text().trim(),
                user_big:$('.user_card .big').text().trim()
            };
            console.log(topicItem);
        });
        setTimeout(function(){
            curCount--;
            callback(null, url);
        },1000);
    };

    // 使用async控制异步抓取
    // mapLimit(arr, limit, iterator, [callback])
    // 异步回调
    async.mapLimit(topicUrls,5,function(url,callback){
        reptileMove(url,callback);
    },function (err, result) {
        if(err){
            console.log(2);
            console.log(err);
        }
        endDate = new Date();
        console.log('final:');
        console.log(result);
        console.log(startDate);
        console.log(endDate);

    })

});

pageUrls.forEach(function(pageUrl){
    superagent.get(pageUrl).end(function (err, res) {
        if(err){
            console.log(3);
            console.log(err);
        }
        console.warn('fetch ' + pageUrl + 'successful');

        var $ = cheerio.load(res.text);
        $('#topic_list .topic_title').each(function(index,elem){
            var $elem = $(elem);
            var topicUrl = url.resolve(firstUrl,$elem.attr('href'));
            urlArray.push(topicUrl);
            //ep
            ep.emit('topicArticleHtml',topicUrl);
        });


    })
});






function getPageUrls(tab,pageNum){
    var pageUrls = [];
    for(var i = 1; i <= pageNum; i++){
        pageUrls.push('https://cnodejs.org/?tab='+ tab + '&page=' + i);
    }
    return pageUrls;
}