(function () {
    "use strict";

    function extract_headers_from_post(postElement) {
        let headers = [];
        for (let child of postElement.children) {
            let array = child.tagName.match(/^H(\d)$/);
            if (array !== null) {
                headers.push({
                    anchor: child.id,
                    title: child.textContent,
                    level: parseInt(array[1])
                })
            }
        }
        return headers;
    }

    function generate_toc_tree(headers) {
        let topTocItem = {
            title: null,
            anchor: '',
            items: null
        };

        let tocStack = [topTocItem]

        for (let {
                anchor,
                title,
                level
            } of headers) {
            // fix new item level and toc stack
            if (level < 1) {
                level = 1;
            }
            if (level > tocStack.length) {
                // if the level of new toc item is too big, treat it as the child of last toc item
                // this is usually caused by wrong header numbers, such as [h1, h2, h4, h2]
                level = tocStack.length;
            } else if (level < tocStack.length) {
                // if the level of new toc item is smaller than length of tocStack, truncate tocStack
                // we always push new toc item to the top of the stack
                tocStack.splice(level, tocStack.length - level);
            }

            let previousTocItem = tocStack[level - 1];
            let topTocItem = {
                title,
                anchor,
                level,
                items: null
            };

            if (previousTocItem.items === null || previousTocItem === undefined) {
                previousTocItem.items = [];
            }
            previousTocItem.items.push(topTocItem);
            tocStack.push(topTocItem);
        }
        return topTocItem.items;
    }

    function generate_toc_for_post(option) {
        option = option || {};
        let postSelectors = option.postSelector || null;
        if (!postSelectors) {
            postSelectors = [
                '.post.post-full', // github pages
                '#cnblogs_post_body', // cnblog
            ]
        }

        let tree = null;
        let postElement = null;
        for (let postSelector of postSelectors) {
            postElement = document.querySelector(postSelector);
            let headers = extract_headers_from_post(postElement);
            if (headers) {
                tree = generate_toc_tree(headers);
                break;
            }
        }
        if (!tree) {
            return
        }

        let topTocElement = document.createElement('ul');
        topTocElement.className = 'post-toc-list'

        let queue = tree.slice(); // a shadow copy
        while (queue.length > 0) {
            let head = queue.shift();

            let tocItemElement = document.createElement('li');
            let linkElement = document.createElement('a')
            linkElement.href = '#' + head.anchor;
            linkElement.textContent = head.title;
            tocItemElement.className = 'post-toc-h' + head.level;
            tocItemElement.appendChild(linkElement);

            if (!head.parentElement) {
                head.parentElement = topTocElement;
            }
            head.parentElement.appendChild(tocItemElement);

            if (head.items) {
                let subTocElement = document.createElement('ul');
                subTocElement.className = 'post-toc-list';
                tocItemElement.appendChild(subTocElement);

                for (let item of head.items) {
                    item.parentElement = subTocElement;
                    queue.push(item);
                }
            }
        }

        let titleElement = document.createElement('div');
        titleElement.textContent = 'OUTLINE';
        titleElement.className = 'post-toc-title';

        let navElement = document.createElement('nav');
        navElement.className = 'post-toc'
        navElement.appendChild(titleElement);
        navElement.appendChild(topTocElement);
        postElement.insertBefore(navElement, postElement.firstChild);
    }

    generate_toc_for_post()
})()