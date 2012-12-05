#!/bin/sh

#if [ "$USER" != "webadmin" ];then
#	echo $"use 'su webadmin' to change the user";
#	su - webadmin -c "$0 $*";
#	exit 1
#fi

#
# 请检查此处的环境变量，和node安装目录，node_modules目录是否一致
#
export PATH="$PATH:/usr/local/node/bin"
export NODE_PATH='/usr/local/lib/node_modules/'

set -e

declare param=""
declare path="/data/home2/haiyuchen/test/test_git/node"
declare log="/data/home2/haiyuchen/test/test_git/node/log/main.log"

for((i=1;i<$#;i++));do
	case $(eval echo \${$i}) in
		-debug)
			export NODE_NOCHECK="true"
			param="$param -debug"
			;;
		-port)
			i=`expr $i + 1`
			param="$param -port $(eval echo \${$i})"
			;;
		-path)
			i=`expr $i + 1`
			path="$(eval echo \${$i})"
			;;
		-log)
			i=`expr $i + 1`
			param="$param -log $(eval echo \${$i})"
			log="$(eval echo \${$i})"
			;;
		*)
			param="$param $(eval echo \${$i})"
			;;
	esac
done

checkpath()
{
	local param="$1"
	local file=${param##*/}
	local path=${param%/*}
	if [ -f $1 ];then
		echo "set log file[$1]"
	else
		echo "no log file[$1],create it."
		mkdir -p $path
		cd $path
		touch $file
	fi
}

nstart()
{
	local pid=`ps ax|grep -E "[0-9]+ node $path/bootstrap.js" |head -1 |awk '{print $1}'`
	if [ -n "$pid" ];
	  then
	  echo "process exist"
	else
	  echo 'no progress,start'
	  checkpath $log
	  echo "nohup node $path/bootstrap.js$param >> $log &"
	  eval "nohup node $path/bootstrap.js$param >> $log &"
	fi
}

nstop()
{
	local pid=`ps ax|grep -E "[0-9]+ node $path/bootstrap.js" | head -1 |awk '{print $1}'`
	if [ -n "$pid" ];
	  then
	  echo "stop process"
	  kill -3 $pid
	fi
}

nstopforce()
{
	fp=`ps -A|grep node$|awk '{print $1}'|head -1`
	if [ -n "$fp" ];
	  then
	  kill -9 `ps -A|grep node$|awk '{print $1}'`
	fi
}

nstatus()
{
	fp=`ps -A|grep node$|awk '{print $1}'|head -1`
	if [ -n "$fp" ];
	  then
	  ps u -p `ps -A|grep node$|awk '{print $1}'`
	fi
}

nrestart()
{
	nstop
	sleep 3
	nstart
}

case $(eval echo \${$#}) in
	start)
	  nstart
	  ;;
	stop)
	  nstop
	  ;;
	restart)
	  nrestart
	  ;;
	stopforce)
	  nstopforce
	  ;;
	status)
	  nstatus
	  ;;
	*)
	  echo $"Usage:$0 {start|stop|restart|stopforce|status}"
	  exit 1
	  ;;
esac
exit 0

