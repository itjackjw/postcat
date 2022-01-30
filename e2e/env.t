=== Env

::: open_env_modal {

goto 'http://localhost:4200'

find:
    [select 'jspath:body > eo-root > eo-pages > div > div > eo-api > nz-layout > nz-layout > nz-content > div > div.tabs-bar.f_row > div > eo-env > nz-select > nz-select-top-control > nz-select-search > input']=sel

sel -> '管理环境'

wait 800
}


--- add new Env
--- open_env_modal

find:
    [label '环境名称']
    [input '']=envName
    [label '前置URL']
    [input '']=envUrl
    [label '环境变量：在接口文档或测试的过程中，使用{{变量名}}即可引用该环境变量']
    [input ''] = name [input ''] = value [input ''] = des
    [button '保存']=save [button '取消']=cancel

envName -> '环境名称A'
envUrl -> 'http://www.youtube.com'
name -> 'AA'
# value -> 'aa'
# des -> '变量A'
save -> click

wait 

cancel -> click

sel -> '环境名称A'

wait

find: 
    [label 'http://www.youtube.com'] = url


=== Add API

--- add new api

goto 'http://localhost:4200'

find:
    [input] [img] [label 'API']=btn [img]

btn -> click

find: 
    [button '保存']=save
    [label 'API Path']
    [select 'HTTP']=protocol [select 'POST']=type [input '/']=url
    [label '分组 / API 名称']
    [label '根目录'] [input]=name

type -> 'GET'
name -> '新Get接口'
url -> 'https://m.weibo.cn/api/container/getIndex'
save -> click

find:
    [input] [img] [label 'API']=btn [img]
    [label '新Get接口']=target

