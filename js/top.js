var vm = new Vue({
    el: '#app',
    data: {
        apiKey: '',
        keyword: '', // 直前に検索したキーワードを保存しておく
        results: null,
        params: {
            channel: {
                q: '',
                part: 'snippet',
                type: 'channel',
                maxResults: '10',
                key: ''
            },
            statistics: {
                part: 'snippet,statistics',
                id: '',
                key: ''
            }
        },
        sort: {
            key: '',
            order: ''
        }
    },
    methods: {
        // チャンネル検索(Search :list)
        searchChannels: function () {
            // 直前に検索したキーワードを再度検索する場合はAPIを叩かず、既存のresultsをソートする
            if(this.params.channel.q == this.keyword) {
                console.log('log1: ' + this.sort.order);
                this.results = this.results.slice().sort(this.compareFunc);
            } else {
                var own = this;
                this.params.channel.key = this.apiKey;
                this.keyword = this.params.channel.q;
                // YouTube Data API実行
                axios
                    .get('https://www.googleapis.com/youtube/v3/search', {params: this.params.channel})
                    .then(function (res) {
                        var channelIds = [];
                        for(item of res.data.items) {
                            channelIds.push(item.id.channelId);
                        }
                        console.log(channelIds);
                        own.searchChannelStatistics(channelIds);
                    })
                    .catch(function (err) {
                        console.log(err);
                    });
            }
        },
        // チャンネル統計情報取得(Channel: list)
        searchChannelStatistics: function (channelIds) {
            this.params.statistics.id = channelIds.join(',');
            var own = this;
            this.params.statistics.key = this.apiKey;
            // YouTube Data API実行
            axios
                .get('https://www.googleapis.com/youtube/v3/channels', {params: this.params.statistics})
                .then(function (res) {
                    // ソートキーに従ってソートする。デフォルトは検索時の結果をそのまま返す。
                    console.log(own.sort.key);
                    console.log(own.sort.order);
                    own.results = res.data.items.sort(own.compareFunc);
                    console.log(own.results);
                })
                .catch(function (err) {
                    console.log(err);
                });
        },
        // 比較関数
        compareFunc: function (a, b) {
            var order = this.sort.order == "asc" ? true : false;
            switch(this.sort.key) {
                case 'subscriberCount':
                    return (a.statistics.subscriberCount - b.statistics.subscriberCount) * (order ? 1 : -1);
                    break;
                case 'viewCount':
                    return (a.statistics.viewCount - b.statistics.viewCount) * (order ? 1 : -1);
                    break;
                default:
                    return 0;
            }
        },
        // CSVファイルダウンロード
        downloadCSV: function () {
            var csv = '\ufeff' + 'チャンネルURL,YouTuber名,登録者数,再生回数,チャンネル内容\n'
            this.results.forEach(el => {
                var line =
                'https://www.youtube.com/channel/' + el['id'] + ','
                + el['snippet']['title'].replace(/\r?\n/g,"") + ','
                + el['statistics']['subscriberCount'] + ','
                + el['statistics']['viewCount'] + ','
                + el['snippet']['description'].replace(/\r?\n/g,"") + '\n';
                csv += line;
            })
            let blob = new Blob([csv], { type: 'text/csv' });
            let link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = 'Result.csv';
            link.click();
        }
    }
});
